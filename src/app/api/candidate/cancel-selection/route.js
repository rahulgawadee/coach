import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CandidateCoachAssignment from '@/models/CandidateCoachAssignment';
import CoachProfile from '@/models/CoachProfile';

function getToken(request) {
  const authHeader = request.headers.get('authorization');
  return authHeader?.split(' ')[1] || request.cookies.get('authToken')?.value || request.cookies.get('token')?.value;
}

export async function POST(request) {
  try {
    await dbConnect();
    const token = getToken(request);
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const verification = verifyToken(token);
    if (!verification.valid) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const userId = verification.userId;
    const user = await User.findById(userId);

    if (!user || user.role !== 'Candidate') {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    // Find pending assignment
    const assignment = await CandidateCoachAssignment.findOne({
      candidateId: userId,
      status: 'pending_acceptance',
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: 'No pending assignment found' }, { status: 404 });
    }

    // Decrement coach's current assignment count
    const coach = await CoachProfile.findById(assignment.coachId);
    if (coach && coach.currentAssignmentCount > 0) {
      coach.currentAssignmentCount -= 1;
      await coach.save();
    }

    // Delete or mark as cancelled
    await CandidateCoachAssignment.deleteOne({ _id: assignment._id });

    // Update user status back to 'profile_complete'
    user.status = 'profile_complete';
    user.onboardingStep = 3;
    await user.save();

    return NextResponse.json({ success: true, message: 'Selection cancelled' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to cancel selection' }, { status: 500 });
  }
}
