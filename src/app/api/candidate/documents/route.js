import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { createId, getWorkspaceByEmail } from '@/lib/candidateWorkspace';

const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ success: false, error: 'Missing email' }, { status: 400 });

    await dbConnect();
    const { workspace } = await getWorkspaceByEmail(email);

    return NextResponse.json({ success: true, data: workspace.documents || [] });
  } catch (error) {
    console.error('Candidate documents GET error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, folder, fileName, fileType, fileSize, fileData } = body;
    if (!email || !folder || !fileName || !fileType) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });

    if (!allowedTypes.includes(fileType)) return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 });

    await dbConnect();
    const { workspace } = await getWorkspaceByEmail(email);

    const doc = {
      id: createId('doc'),
      folder,
      fileName,
      fileType,
      fileSize: fileSize || 0,
      fileData: fileData || '',
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'candidate',
    };

    workspace.documents = workspace.documents || [];
    workspace.documents.unshift(doc);

    workspace.notifications = workspace.notifications || [];
    workspace.notifications.push({ id: createId('notif'), title: 'Document Uploaded', message: `${fileName} uploaded.`, type: 'document', href: '/candidate/documents', read: false });

    await workspace.save();

    return NextResponse.json({ success: true, doc });
  } catch (error) {
    console.error('Candidate documents POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');
    if (!email || !id) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });

    await dbConnect();
    const { workspace } = await getWorkspaceByEmail(email);

    workspace.documents = (workspace.documents || []).filter((d) => d.id !== id);
    await workspace.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Candidate documents DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
