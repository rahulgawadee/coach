import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CoachAvailability from '@/models/CoachAvailability';
import { verifyToken } from '@/lib/jwt';

export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { date, startTime, endTime, reason, recurring } = body;
    if (!date || !startTime || !endTime) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const blockedSlot = new CoachAvailability({
      coachEmail: decoded.email,
      date,
      startTime,
      endTime,
      reason: reason || 'Time Off',
      blocked: true,
      recurring: recurring || false,
    });

    await blockedSlot.save();

    return NextResponse.json({ success: true, data: blockedSlot });
  } catch (error) {
    console.error('Block availability error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
