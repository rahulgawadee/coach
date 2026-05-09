import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CandidateWorkspace from '@/models/CandidateWorkspace';
import { verifyToken } from '@/lib/jwt';
import { createId } from '@/lib/candidateWorkspace';

export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { requestId } = body;
    if (!requestId) return NextResponse.json({ success: false, error: 'Missing requestId' }, { status: 400 });

    await dbConnect();

    // Find the workspace with this request
    const workspace = await CandidateWorkspace.findOne({ 'events.id': requestId, 'events.status': 'requested' });
    if (!workspace) return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });

    // Update event status to declined
    workspace.events = workspace.events.map((event) => {
      if (event.id === requestId) {
        return { ...event, status: 'declined' };
      }
      return event;
    });

    // Add notification to candidate
    workspace.notifications = workspace.notifications || [];
    workspace.notifications.push({
      id: createId('notif'),
      title: 'Session Request Declined',
      message: 'Your session request has been declined by the coach.',
      type: 'session',
      href: '/candidate/calendar',
      read: false,
    });

    await workspace.save();

    return NextResponse.json({ success: true, message: 'Request declined' });
  } catch (error) {
    console.error('Decline request error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
