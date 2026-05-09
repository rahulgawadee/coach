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

    let candidateUserId;
    try {
      const decoded = verifyToken(token);
      candidateUserId = decoded.userId;
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Get the candidate's latest accepted assignment
    const assignment = await CandidateCoachAssignment.findOne({
      candidateId: candidateUserId,
      status: 'accepted',
    })
      .populate('coachId')
      .sort({ assignedAt: -1 });

    if (!assignment) {
      return NextResponse.json({
        success: true,
        hasCoach: false,
        data: null,
      });
    }

    // Get coach's user details
    const coachUser = await User.findById(assignment.coachId.userId);

    // Get coach profile for more details
    const coachFullProfile = await CoachProfile.findById(assignment.coachId._id);

    return NextResponse.json({
      success: true,
      hasCoach: true,
      data: {
        assignmentId: assignment._id,
        coachId: assignment.coachId._id,
        coachName: coachFullProfile?.firstName
          ? `${coachFullProfile.firstName} ${coachFullProfile.lastName || ''}`
          : coachUser?.firstName + ' ' + (coachUser?.lastName || ''),
        coachEmail: coachUser?.email,
        coachPhone: coachUser?.phoneNumber,
        coachCompany: coachFullProfile?.companyName,
        coachBio: coachFullProfile?.bio,
        coachExpertise: coachFullProfile?.expertiseAreas || [],
        coachRating: coachFullProfile?.rating || 5,
        startDate: assignment.assignedAt,
        status: assignment.status,
      },
    });
  } catch (error) {
    console.error('Error fetching candidate coach info:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
