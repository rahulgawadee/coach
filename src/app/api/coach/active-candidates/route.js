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

    const result = verifyToken(token);
    console.log('API Debug - Token Result:', JSON.stringify(result));
    
    if (!result.valid) {
      return NextResponse.json({ success: false, error: 'Unauthorized: ' + result.error }, { status: 401 });
    }

    const coachUserId = result.userId;
    const coachUser = await User.findById(coachUserId);
    console.log('API Debug - Coach ID:', coachUserId, 'User found:', !!coachUser, 'Role:', coachUser?.role);
    
    if (!coachUser || coachUser.role?.toLowerCase() !== 'coach') {
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
      .populate('candidateId', 'name email')
      .sort({ assignedAt: -1 });

    // Enrich with candidate profile data
    const activeCandiates = await Promise.all(
      activeAssignments.map(async (assignment) => {
        const candidateProfile = await CandidateProfile.findOne({
          userId: assignment.candidateId._id,
        });

        // Construct name from profile or User name
        const fName = candidateProfile?.firstName || assignment.candidateId.name?.split(' ')[0] || 'Candidate';
        const lName = candidateProfile?.lastName || assignment.candidateId.name?.split(' ').slice(1).join(' ') || '';

        // Calculate progress percentage (mock for now)
        const progressPercentage = Math.floor(Math.random() * 100);

        return {
          candidateId: assignment.candidateId._id,
          assignmentId: assignment._id,
          candidateName: `${fName} ${lName}`.trim(),
          candidateEmail: assignment.candidateId.email,
          startDate: assignment.assignedAt,
          progress: progressPercentage,
          nextSession: assignment.nextSession || null,
          profileData: candidateProfile
            ? {
                occupation: candidateProfile.currentOccupation || 'Unknown',
                location: candidateProfile.location || 'Unknown',
                experience: candidateProfile.yearsExperience || 0,
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
