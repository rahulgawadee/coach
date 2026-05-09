import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CoachProfile from '@/models/CoachProfile';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;
    
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded.valid) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    await dbConnect();
    const coachUserId = decoded.userId;

    const coachProfile = await CoachProfile.findOne({ userId: coachUserId });
    if (!coachProfile) return NextResponse.json({ success: true, data: [] });

    // In a real app, we would have a Notification model. 
    // For now, we'll return a few mock notifications based on profile state.
    const notifications = [
      {
        id: 'n1',
        title: 'Welcome to your Dashboard',
        message: 'Your profile is active and ready for candidates.',
        type: 'info',
        createdAt: new Date().toISOString(),
        read: false
      }
    ];

    if (coachProfile.currentAssignmentCount > 0) {
      notifications.push({
        id: 'n2',
        title: 'New Candidate Assigned',
        message: 'A new candidate has been matched with your profile.',
        type: 'success',
        createdAt: new Date().toISOString(),
        read: false
      });
    }

    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Coach notifications error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
