import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CandidateWorkspace from '@/models/CandidateWorkspace';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    // In Next.js 15+, params is a Promise and must be awaited
    const awaitedParams = await params;
    const { id: candidateUserId } = awaitedParams;

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const result = verifyToken(token);
    if (!result.valid) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const coachUser = await User.findById(result.userId);
    if (!coachUser || (coachUser.role !== 'Coach' && coachUser.role !== 'coach')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const workspace = await CandidateWorkspace.findOne({ userId: candidateUserId });
    if (!workspace) return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });

    const messages = (workspace.messages || []).filter(m => m.conversation === 'coach');

    // Mark as seen
    let updated = false;
    workspace.messages = (workspace.messages || []).map(m => {
      const mObj = m.toObject ? m.toObject() : m;
      if (mObj.conversation === 'coach' && mObj.sender === 'candidate' && !mObj.seen) {
        updated = true;
        return { ...mObj, seen: true };
      }
      return mObj;
    });

    if (updated) {
      await workspace.save();
    }

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
