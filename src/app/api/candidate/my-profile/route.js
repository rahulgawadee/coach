import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import CandidateProfile from '@/models/CandidateProfile';

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

    const profile = await CandidateProfile.findOne({ userId: verification.userId });
    if (!profile) return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: profile }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to load profile' }, { status: 500 });
  }
}