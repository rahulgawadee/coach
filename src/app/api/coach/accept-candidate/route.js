import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CandidateCoachAssignment from '@/models/CandidateCoachAssignment';
import CandidateProfile from '@/models/CandidateProfile';
import CoachProfile from '@/models/CoachProfile';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function POST(request) {
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
        { success: false, error: 'Only coaches can accept candidates' },
        { status: 403 }
      );
    }

    const { assignmentId } = await request.json();

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'assignmentId is required' },
        { status: 400 }
      );
    }

    // Get the assignment
    const assignment = await CandidateCoachAssignment.findById(assignmentId)
      .populate('candidateId')
      .populate('coachId');

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Verify the coach owns this assignment
    const coachProfile = await CoachProfile.findOne({ userId: coachUserId });
    if (!coachProfile || assignment.coachId._id.toString() !== coachProfile._id.toString()) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to accept this candidate' },
        { status: 403 }
      );
    }

    // Check if already accepted/rejected
    if (assignment.status !== 'pending_acceptance') {
      return NextResponse.json(
        { success: false, error: `Assignment already ${assignment.status}` },
        { status: 400 }
      );
    }

    // Check coach capacity
    const activeAssignments = await CandidateCoachAssignment.countDocuments({
      coachId: assignment.coachId._id,
      status: 'accepted',
    });

    if (activeAssignments >= coachProfile.maxCandidates) {
      return NextResponse.json(
        { success: false, error: 'Coach has reached maximum candidate capacity' },
        { status: 400 }
      );
    }

    // Update assignment status to 'accepted'
    assignment.status = 'accepted';
    assignment.updatedAt = new Date();
    await assignment.save();

    // Update candidate profile status
    const candidateProfile = await CandidateProfile.findOne({ userId: assignment.candidateId._id });
    if (candidateProfile) {
      candidateProfile.profileStatus = 'coach_selected';
      candidateProfile.selectedCoachId = assignment.coachId._id;
      await candidateProfile.save();
    }

    // Update candidate user onboarding step
    const candidateUser = await User.findById(assignment.candidateId._id);
    if (candidateUser) {
      candidateUser.onboardingStep = 5; // 5 = active coaching relationship
      await candidateUser.save();
    }

    // Update coach's current assignments count
    coachProfile.currentAssignmentCount = (coachProfile.currentAssignmentCount || 0) + 1;
    await coachProfile.save();

    // Update CandidateWorkspace with real coach info
    const CandidateWorkspace = (await import('@/models/CandidateWorkspace')).default;
    const workspace = await CandidateWorkspace.findOne({ userId: assignment.candidateId._id.toString() });
    if (workspace) {
      workspace.coach = {
        name: coachUser.name || 'Your Coach',
        company: coachProfile.organization || 'Coach Mentorship',
        rating: 5.0,
        ratingCount: 1,
        experienceYears: coachProfile.yearsOfExperience || 5,
        bio: coachProfile.bio || 'Professional Coach',
        specialties: coachProfile.expertise || []
      };
      await workspace.save();
    }

    // TODO: Create initial calendar event (Welcome Session)
    // TODO: Send notification to candidate
    // TODO: Enable messaging between coach and candidate

    return NextResponse.json({
      success: true,
      message: 'Candidate accepted successfully',
      assignment: assignment,
    });
  } catch (error) {
    console.error('Error accepting candidate:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
