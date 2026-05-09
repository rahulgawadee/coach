import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CoachProfile from '@/models/CoachProfile';

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'Coach') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const profile = await CoachProfile.findOne({ userId: decoded.userId }).lean();

    const companyData = {
      companyName: profile?.companyName || '',
      registrationNumber: profile?.companyRegistration || '',
      governmentAgencyId: profile?.governmentAgencyId || '',
      status: 'Active',
      stats: {
        averageRating: profile?.averageRating || 0,
        successRate: profile?.successRate || 0,
        totalCoaches: 1,
        totalReviews: 0,
      },
      coaches: [{
        name: `${user.firstName} ${user.lastName}`,
        rating: profile?.averageRating || 0,
        currentCandidates: profile?.currentAssignments || 0,
        yearsExperience: profile?.yearsExperience || 0,
      }],
      testimonials: [],
      contactPerson: profile?.contactPerson || '',
      contactEmail: profile?.contactEmail || '',
      contactPhone: profile?.contactPhone || '',
    };

    return NextResponse.json({ success: true, data: companyData });
  } catch (error) {
    console.error('Get company profile error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
