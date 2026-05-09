import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CandidateCoachAssignment from '@/models/CandidateCoachAssignment';
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
        { success: false, error: 'Only coaches can decline candidates' },
        { status: 403 }
      );
    }

    const { assignmentId, reason } = await request.json();

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
        { success: false, error: 'Not authorized to decline this candidate' },
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

    // Update assignment status to 'rejected'
    assignment.status = 'rejected';
    assignment.reason = reason || 'Coach is unavailable';
    assignment.updatedAt = new Date();
    await assignment.save();

    // TODO: Send notification to candidate: "Coach is unavailable. Please select another coach."
    // TODO: Update candidate status to allow re-selection

    return NextResponse.json({
      success: true,
      message: 'Candidate declined successfully',
      assignment: assignment,
    });
  } catch (error) {
    console.error('Error declining candidate:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
