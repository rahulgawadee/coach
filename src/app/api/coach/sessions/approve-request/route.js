import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CoachProfile from '@/models/CoachProfile';
import CandidateWorkspace from '@/models/CandidateWorkspace';
import { emitCandidateEvent, WEBSOCKET_EVENTS } from '@/lib/websocket';

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
    const { candidateUserId, eventId, newDate, newTime, meetingLink, note } = body;

    if (!candidateUserId || !eventId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const workspace = await CandidateWorkspace.findOne({ userId: candidateUserId });
    if (!workspace) return NextResponse.json({ success: false, error: 'Candidate workspace not found' }, { status: 404 });

    const evIndex = (workspace.events || []).findIndex((e) => e.id === eventId);
    if (evIndex === -1) return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });

    // Update event
    if (newDate) workspace.events[evIndex].date = newDate;
    if (newTime) workspace.events[evIndex].time = newTime;
    workspace.events[evIndex].status = 'confirmed';
    if (meetingLink) workspace.events[evIndex].meetingLink = meetingLink;

    workspace.notifications.push({
      id: `notif_${Math.random().toString(36).slice(2, 9)}`,
      title: 'Session Approved',
      message: `Your session request for ${workspace.events[evIndex].date} ${workspace.events[evIndex].time} was approved.`,
      type: 'calendar',
      href: '/candidate/calendar',
      read: false,
    });

    await workspace.save();

    // Emit WebSocket event to candidate
    const candidateUser = await User.findById(candidateUserId);
    if (candidateUser) {
      emitCandidateEvent(WEBSOCKET_EVENTS.SESSION_APPROVED, {
        eventId,
        date: workspace.events[evIndex].date,
        time: workspace.events[evIndex].time,
        meetingLink: workspace.events[evIndex].meetingLink,
      }, candidateUser.email);
    }

    return NextResponse.json({ success: true, event: workspace.events[evIndex] });
  } catch (error) {
    console.error('Approve request error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
