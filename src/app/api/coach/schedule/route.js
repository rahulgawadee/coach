import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CoachProfile from '@/models/CoachProfile';
import CandidateCoachAssignment from '@/models/CandidateCoachAssignment';
import CandidateWorkspace from '@/models/CandidateWorkspace';
import CoachAvailability from '@/models/CoachAvailability';

export async function GET(request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;

    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    let coachUserId;
    try {
      const decoded = verifyToken(token);
      coachUserId = decoded.userId;
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const coachUser = await User.findById(coachUserId);
    if (!coachUser || coachUser.role !== 'Coach') {
      return NextResponse.json({ success: false, error: 'Only coaches can view schedule' }, { status: 403 });
    }

    const coachProfile = await CoachProfile.findOne({ userId: coachUserId });
    if (!coachProfile) {
      return NextResponse.json({ success: false, error: 'Coach profile not found' }, { status: 404 });
    }

    // Find accepted candidate assignments
    const assignments = await CandidateCoachAssignment.find({ coachId: coachProfile._id, status: 'accepted' }).populate('candidateId', 'firstName lastName email');

    const confirmedSessions = [];
    const pendingRequests = [];

    for (const assignment of assignments) {
      const candidateUserId = assignment.candidateId._id.toString();
      const workspace = await CandidateWorkspace.findOne({ userId: candidateUserId });
      if (!workspace) continue;

      for (const ev of workspace.events || []) {
        const enriched = {
          ...ev._doc || ev,
          candidateId: candidateUserId,
          candidateName: `${assignment.candidateId.firstName} ${assignment.candidateId.lastName}`,
        };

        if (ev.status === 'confirmed') confirmedSessions.push(enriched);
        else if (ev.status === 'requested') pendingRequests.push(enriched);
      }
    }

    const blockedSlots = await CoachAvailability.find({ coachId: coachProfile._id, blocked: true });

    return NextResponse.json({ success: true, schedule: { confirmedSessions, pendingRequests, blockedSlots } });
  } catch (error) {
    console.error('Coach schedule error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;

    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    let coachUserId;
    try {
      const decoded = verifyToken(token);
      coachUserId = decoded.userId;
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { candidateUserId, date, startTime, endTime, sessionType, meetingLink, notes } = body;
    if (!candidateUserId || !date || !startTime) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const workspace = await CandidateWorkspace.findOne({ userId: candidateUserId });
    if (!workspace) return NextResponse.json({ success: false, error: 'Candidate workspace not found' }, { status: 404 });

    const event = {
      id: `evt_${Math.random().toString(36).slice(2, 9)}`,
      title: `${sessionType} with ${workspace.coach?.name || 'Coach'}`,
      date,
      time: startTime,
      type: 'session',
      coachName: workspace.coach?.name || '',
      topic: sessionType,
      message: notes || '',
      status: 'confirmed',
    };

    workspace.events.push(event);
    workspace.notifications.push({
      id: `notif_${Math.random().toString(36).slice(2, 9)}`,
      title: 'New Session Scheduled',
      message: `A session was scheduled for ${date} ${startTime}`,
      type: 'calendar',
      href: '/candidate/calendar',
      read: false,
    });

    await workspace.save();

    return NextResponse.json({ success: true, session: event });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
