import { NextResponse } from 'next/server';
import { getWorkspaceByEmail } from '@/lib/candidateWorkspace';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    const { workspace } = await getWorkspaceByEmail(email);

    const unreadMessages = workspace.messages.filter((m) => m.conversation === 'coach' && !m.seen).length;
    const pendingDocuments = workspace.documents.filter((d) => d.folder === 'my-uploads').length;
    const completedSections = [
      workspace.profile.phone,
      workspace.profile.address,
      workspace.profile.personnummer,
      workspace.profile.skills.length > 0,
      workspace.agreement.signed,
    ].filter(Boolean).length;

    const completionPercent = Math.round((completedSections / 5) * 100);

    return NextResponse.json({
      success: true,
      data: {
        firstName: workspace.firstName,
        coach: workspace.coach,
        unreadMessages,
        pendingDocuments,
        announcements: workspace.announcements,
        completionPercent,
        upcomingEvents: workspace.events.slice(0, 5),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
