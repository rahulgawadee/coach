import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CandidateProfile from '@/models/CandidateProfile';
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

    const { coachId } = await request.json();
    const userId = verification.userId;
    const user = await User.findById(userId);
    const candidateProfile = await CandidateProfile.findOne({ userId });
    const coach = await CoachProfile.findById(coachId);

    if (!user || user.role !== 'Candidate') {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    if (!coach) {
      return NextResponse.json({ success: false, error: 'Coach not found' }, { status: 404 });
    }

    if (coach.currentAssignmentCount >= coach.maxCandidates) {
      return NextResponse.json({ success: false, error: 'This coach is now full. Please select another.' }, { status: 400 });
    }

    const existing = await CandidateCoachAssignment.findOne({ candidateId: userId, status: 'pending_acceptance' });
    if (existing) {
      return NextResponse.json({ success: false, error: 'You already have a pending coach selection.' }, { status: 400 });
    }

    const assignment = await CandidateCoachAssignment.create({
      candidateId: userId,
      coachId,
      status: 'pending_acceptance',
      rank: 1,
      matchScore: 0,
      reason: 'Candidate selected this coach directly',
    });

    coach.currentAssignmentCount += 1;
    await coach.save();

    user.onboardingStep = 4;
    user.status = 'pending_acceptance';
    await user.save();

    if (candidateProfile) {
      candidateProfile.selectedCoachId = coachId;
      candidateProfile.selectedCoachName = coach.fullName;
      candidateProfile.profileStatus = 'coach_selected';
      await candidateProfile.save();
    }

    return NextResponse.json({ success: true, data: { assignmentId: assignment._id } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to select coach' }, { status: 500 });
  }
}