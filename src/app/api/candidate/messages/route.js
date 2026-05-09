import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { createId, getWorkspaceByEmail } from '@/lib/candidateWorkspace';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ success: false, error: 'Missing email' }, { status: 400 });

    await dbConnect();
    const { workspace } = await getWorkspaceByEmail(email);

    const announcements = (workspace.messages || []).filter((m) => m.conversation === 'announcements');
    const coachMessages = (workspace.messages || []).filter((m) => m.conversation === 'coach');

    return NextResponse.json({ success: true, data: { announcements, coachMessages, coachName: workspace.coach?.name } });
  } catch (error) {
    console.error('Candidate messages GET error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, conversation, text, attachments } = body;
    if (!email || !conversation || !text) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });

    if (conversation === 'announcements') return NextResponse.json({ success: false, error: 'Announcements are read-only' }, { status: 403 });

    await dbConnect();
    const { workspace } = await getWorkspaceByEmail(email);

    const msg = {
      id: createId('msg'),
      conversation,
      sender: 'candidate',
      text,
      attachments: attachments || [],
      seen: false,
      createdAt: new Date().toISOString(),
    };

    workspace.messages = workspace.messages || [];
    workspace.messages.push(msg);

    workspace.notifications = workspace.notifications || [];
    workspace.notifications.push({ id: createId('notif'), title: 'Message Sent', message: text.slice(0, 200), type: 'message', href: '/candidate/messages', read: false });

    await workspace.save();

    return NextResponse.json({ success: true, message: 'Message sent', msg });
  } catch (error) {
    console.error('Candidate messages POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { email, conversation } = body;

    await dbConnect();
    const { workspace } = await getWorkspaceByEmail(email);

    workspace.messages = (workspace.messages || []).map((message) => {
      if (!conversation || message.conversation === conversation) {
        return { ...message, seen: true };
      }
      return message;
    });

    await workspace.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Candidate messages PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
