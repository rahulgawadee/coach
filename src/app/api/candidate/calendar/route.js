import { NextResponse } from 'next/server';
import { createId, getWorkspaceByEmail } from '@/lib/candidateWorkspace';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    const { workspace } = await getWorkspaceByEmail(email);

    return NextResponse.json({
      success: true,
      data: {
        events: workspace.events,
        coachAvailability: ['09:00', '10:00', '14:00', '15:00', '16:00'],
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, preferredDate, preferredTime, topic, message } = body;

    if (!email || !preferredDate || !preferredTime || !topic) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { workspace } = await getWorkspaceByEmail(email);

    workspace.events.push({
      id: createId('evt'),
      title: 'Session Request',
      date: preferredDate,
      time: preferredTime,
      type: 'session',
      coachName: workspace.coach.name,
      topic,
      message: message || '',
      status: 'requested',
    });

    workspace.notifications.push({
      id: createId('notif'),
      title: 'Session Request Sent',
      message: `Your ${topic} request for ${preferredDate} ${preferredTime} is sent.`,
      type: 'calendar',
      href: '/candidate/calendar',
      read: false,
    });

    await workspace.save();

    return NextResponse.json({ success: true, message: 'Session request submitted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
