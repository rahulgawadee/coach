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
        { success: false, error: 'Only coaches can view pending requests' },
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

    // Get all pending assignments for this coach
    const pendingAssignments = await CandidateCoachAssignment.find({
      coachId: coachProfile._id,
      status: 'pending_acceptance',
    })
      .populate('candidateId', 'firstName lastName email')
      .sort({ assignedAt: -1 });

    // Enrich with candidate profile data
    const enrichedRequests = await Promise.all(
      pendingAssignments.map(async (assignment) => {
        const candidateProfile = await CandidateProfile.findOne({
          userId: assignment.candidateId._id,
        });

        return {
          assignmentId: assignment._id,
          candidateId: assignment.candidateId._id,
          candidateName: `${assignment.candidateId.firstName} ${assignment.candidateId.lastName}`,
          candidateEmail: assignment.candidateId.email,
          matchScore: assignment.matchScore,
          rank: assignment.rank,
          reason: assignment.reason,
          requestedAt: assignment.assignedAt,
          profile: candidateProfile
            ? {
                occupation: candidateProfile.occupation,
                location: candidateProfile.location,
                industryPreferences: candidateProfile.industryPreferences,
                experience: candidateProfile.experience,
                education: candidateProfile.education,
                skills: candidateProfile.skills,
                about: candidateProfile.about,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: enrichedRequests.length,
      requests: enrichedRequests,
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
