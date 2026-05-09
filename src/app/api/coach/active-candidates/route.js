import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CandidateCoachAssignment from '@/models/CandidateCoachAssignment';
import CoachProfile from '@/models/CoachProfile';
import User from '@/models/User';
import CandidateProfile from '@/models/CandidateProfile';
import CandidateWorkspace from '@/models/CandidateWorkspace';
import { verifyToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const result = verifyToken(token);
    if (!result.valid) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const coachUserId = result.userId;
    const coachUser = await User.findById(coachUserId);
    if (!coachUser || coachUser.role?.toLowerCase() !== 'coach') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const coachProfile = await CoachProfile.findOne({ userId: coachUserId });
    if (!coachProfile) return NextResponse.json({ success: false, error: 'Coach profile not found' }, { status: 404 });

    const activeAssignments = await CandidateCoachAssignment.find({
      coachId: coachProfile._id,
      status: 'accepted',
    })
      .populate('candidateId', 'firstName lastName name email')
      .sort({ assignedAt: -1 });

    const activeCandiates = await Promise.all(
      activeAssignments.map(async (assignment) => {
        const candidateProfile = await CandidateProfile.findOne({ userId: assignment.candidateId._id });
        const workspace = await CandidateWorkspace.findOne({ userId: assignment.candidateId._id });

        const fName = candidateProfile?.firstName || assignment.candidateId.firstName || assignment.candidateId.name?.split(' ')[0] || 'Candidate';
        const lName = candidateProfile?.lastName || assignment.candidateId.lastName || assignment.candidateId.name?.split(' ').slice(1).join(' ') || '';

        return {
          candidateId: assignment.candidateId._id,
          assignmentId: assignment._id,
          candidateName: `${fName} ${lName}`.trim(),
          candidateEmail: assignment.candidateId.email,
          startDate: assignment.assignedAt,
          progress: calculateProgress(workspace, candidateProfile),
          nextSession: assignment.nextSession || null,
          profileData: candidateProfile ? {
            occupation: candidateProfile.currentOccupation,
            location: candidateProfile.location,
            experience: candidateProfile.yearsExperience,
          } : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: activeCandiates.length,
      capacity: { current: activeCandiates.length, max: coachProfile.maxCandidates },
      candidates: activeCandiates,
    });
  } catch (error) {
    console.error('Error fetching active candidates:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

function calculateProgress(workspace, profile) {
  if (!workspace && !profile) return 0;
  let score = 10;
  if (profile?.skills?.length > 0) score += 15;
  if (workspace?.agreement?.signed) score += 10;
  const completedSessions = workspace?.events?.filter(e => e.status === 'confirmed' && new Date(e.date) < new Date()).length || 0;
  score += Math.min(completedSessions * 10, 40);
  const docs = workspace?.documents?.length || 0;
  score += Math.min(docs * 5, 25);
  return Math.min(score, 100);
}
