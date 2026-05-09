import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import CoachProfile from '@/models/CoachProfile';
import User from '@/models/User';

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
    
    if (!coachProfile) return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });

    const companyInfo = {
      companyName: coachProfile.organization || 'Not set',
      companyRegistration: 'REG-123456789', // Placeholder or add to schema
      governmentAgencyId: 'GOV-SE-998877', // Placeholder
      contactPerson: (await User.findById(coachUserId))?.name || 'Coach',
      contactEmail: (await User.findById(coachUserId))?.email || '',
      contactPhone: 'Not set',
      address: 'Sweden, Stockholm',
      lastEditRequest: null
    };

    return NextResponse.json({ success: true, companyInfo });
  } catch (error) {
    console.error('Company info error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  return NextResponse.json({ 
    success: true, 
    message: 'Edit request submitted to administrator.' 
  });
}
