import { NextResponse } from 'next/server';
import { getWorkspaceByEmail } from '@/lib/candidateWorkspace';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    const { workspace } = await getWorkspaceByEmail(email);

    return NextResponse.json({
      success: true,
      data: {
        firstName: workspace.firstName,
        lastName: workspace.lastName,
        coach: workspace.coach,
        profile: workspace.profile,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, profile } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const { workspace } = await getWorkspaceByEmail(email);

    workspace.firstName = firstName || workspace.firstName;
    workspace.lastName = lastName || workspace.lastName;
    workspace.profile = {
      ...workspace.profile,
      ...(profile || {}),
    };

    await workspace.save();

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
