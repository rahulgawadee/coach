import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CoachProfile from '@/models/CoachProfile';
import CandidateCoachAssignment from '@/models/CandidateCoachAssignment';
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
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const coachUser = await User.findById(coachUserId);
    if (!coachUser || coachUser.role !== 'Coach') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { subject, message } = body;
    if (!subject || !message) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });

    const coachProfile = await CoachProfile.findOne({ userId: coachUserId });
    if (!coachProfile) return NextResponse.json({ success: false, error: 'Coach profile not found' }, { status: 404 });

    const assignments = await CandidateCoachAssignment.find({ coachId: coachProfile._id, status: 'accepted' });

    let sent = 0;
    for (const a of assignments) {
      const candidateUserId = a.candidateId.toString();
      const workspace = await CandidateWorkspace.findOne({ userId: candidateUserId });
      if (!workspace) continue;

      workspace.messages = workspace.messages || [];
      workspace.messages.push({ id: `msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, conversation: 'announcements', sender: 'coach', text: `${subject}\n\n${message}`, createdAt: new Date().toISOString() });

      workspace.notifications = workspace.notifications || [];
      workspace.notifications.push({ id: `notif_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, title: subject, message: message.slice(0,200), type: 'message', href: '/candidate/messages', read: false });

      await workspace.save();

      // Emit WebSocket event to candidate
      const candidateUser = await User.findById(candidateUserId);
      if (candidateUser) {
        emitCandidateEvent(WEBSOCKET_EVENTS.NEW_ANNOUNCEMENT, {
          subject,
          message: message.slice(0, 200),
          fullMessage: message,
        }, candidateUser.email);
      }

      sent++;
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
