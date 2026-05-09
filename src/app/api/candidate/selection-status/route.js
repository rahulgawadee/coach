import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import CandidateCoachAssignment from '@/models/CandidateCoachAssignment';

function getToken(request) {
  const authHeader = request.headers.get('authorization');
  return authHeader?.split(' ')[1] || request.cookies.get('authToken')?.value || request.cookies.get('token')?.value;
}

export async function GET(request) {
  try {
    await dbConnect();
    const token = getToken(request);
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const verification = verifyToken(token);
    if (!verification.valid) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const assignment = await CandidateCoachAssignment.findOne({ candidateId: verification.userId }).sort({ createdAt: -1 });

    if (!assignment) {
      return NextResponse.json({ success: true, data: { status: 'none' } }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: assignment }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to load selection status' }, { status: 500 });
  }
}