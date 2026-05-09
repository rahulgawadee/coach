import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CandidateCoachAssignment from '@/models/CandidateCoachAssignment';
import CoachProfile from '@/models/CoachProfile';
import User from '@/models/User';
import CandidateProfile from '@/models/CandidateProfile';
import { verifyToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    await dbConnect();

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let coachUserId;
    try {
      const decoded = verifyToken(token);
      coachUserId = decoded.userId;
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Verify user is a coach
    const coachUser = await User.findById(coachUserId);
    if (!coachUser || coachUser.role !== 'Coach') {
      return NextResponse.json(
        { success: false, error: 'Only coaches can view active candidates' },
        { status: 403 }
      );
    }

    // Get coach profile
    const coachProfile = await CoachProfile.findOne({ userId: coachUserId });
    if (!coachProfile) {
      return NextResponse.json(
        { success: false, error: 'Coach profile not found' },
        { status: 404 }
      );
    }

    // Get all accepted assignments for this coach
    const activeAssignments = await CandidateCoachAssignment.find({
      coachId: coachProfile._id,
      status: 'accepted',
    })
      .populate('candidateId', 'firstName lastName email')
      .sort({ assignedAt: -1 });

    // Enrich with candidate profile data
    const activeCandiates = await Promise.all(
      activeAssignments.map(async (assignment) => {
        const candidateProfile = await CandidateProfile.findOne({
          userId: assignment.candidateId._id,
        });

        // Calculate progress percentage (mock for now)
        const progressPercentage = Math.floor(Math.random() * 100);

        return {
          candidateId: assignment.candidateId._id,
          assignmentId: assignment._id,
          candidateName: `${assignment.candidateId.firstName} ${assignment.candidateId.lastName}`,
          candidateEmail: assignment.candidateId.email,
          startDate: assignment.assignedAt,
          progress: progressPercentage,
          nextSession: assignment.nextSession || null,
          profileData: candidateProfile
            ? {
                occupation: candidateProfile.occupation,
                location: candidateProfile.location,
                experience: candidateProfile.experience,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: activeCandiates.length,
      capacity: {
        current: activeCandiates.length,
        max: coachProfile.maxCandidates,
      },
      candidates: activeCandiates,
    });
  } catch (error) {
    console.error('Error fetching active candidates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
