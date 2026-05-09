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
        signed: workspace.agreement.signed,
        signedAt: workspace.agreement.signedAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const { workspace } = await getWorkspaceByEmail(email);

    workspace.agreement.signed = true;
    workspace.agreement.signedAt = new Date();
    workspace.documents.push({
      id: createId('doc'),
      folder: 'signed-agreements',
      fileName: 'Mentorship_Agreement_Signed.pdf',
      fileType: 'application/pdf',
      fileSize: 0,
      fileData: '',
      uploadedAt: new Date(),
    });

    await workspace.save();

    return NextResponse.json({ success: true, message: 'Agreement signed successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
