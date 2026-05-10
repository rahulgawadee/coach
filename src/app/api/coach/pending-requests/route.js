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
    console.log('API Debug (Pending) - Token Result:', JSON.stringify(result));
    
    if (!result.valid) {
      return NextResponse.json({ success: false, error: 'Unauthorized: ' + result.error }, { status: 401 });
    }

    const coachUserId = result.userId;
    const coachUser = await User.findById(coachUserId);
    console.log('API Debug (Pending) - Coach ID:', coachUserId, 'User found:', !!coachUser, 'Role:', coachUser?.role);
    
    if (!coachUser || coachUser.role?.toLowerCase() !== 'coach') {
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
      .populate('candidateId', 'name email avatarUrl')
      .sort({ assignedAt: -1 });

    // Enrich with candidate profile data
    const enrichedRequests = await Promise.all(
      pendingAssignments.map(async (assignment) => {
        const candidateProfile = await CandidateProfile.findOne({
          userId: assignment.candidateId._id,
        });

        // Use profile names as fallback if user names are missing
        const fName = candidateProfile?.firstName || assignment.candidateId.name?.split(' ')[0] || 'Candidate';
        const lName = candidateProfile?.lastName || assignment.candidateId.name?.split(' ').slice(1).join(' ') || '';

        return {
          assignmentId: assignment._id,
          candidateId: assignment.candidateId._id,
          candidateName: `${fName} ${lName}`.trim(),
          candidateEmail: assignment.candidateId.email,
          avatarUrl: assignment.candidateId.avatarUrl || candidateProfile?.avatarUrl || '',
          matchScore: assignment.matchScore || 0,
          rank: assignment.rank,
          reason: assignment.reason,
          requestedAt: assignment.assignedAt,
          profile: candidateProfile
            ? {
                occupation: candidateProfile.currentOccupation || 'Unknown',
                location: candidateProfile.location || 'Unknown',
                industryPreferences: candidateProfile.industryPreferences || [],
                experience: candidateProfile.yearsExperience || 0,
                education: candidateProfile.educationLevel || 'Unknown',
                skills: candidateProfile.skills || [],
                about: candidateProfile.aboutYourself || '',
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
