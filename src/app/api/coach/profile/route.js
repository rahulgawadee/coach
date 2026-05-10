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
    if (!user || (user.role?.toLowerCase() !== 'coach')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const profile = await CoachProfile.findOne({ userId: decoded.userId }).lean();

    const profileData = {
      // Personal Information
      fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || '',
      email: user.email,
      phone: user.phone || '',

      // Professional Information
      bio: profile?.bio || '',
      expertise: profile?.expertise || profile?.expertiseAreas || [],
      yearsExperience: profile?.yearsExperience || 0,
      certifications: profile?.certifications || [],
      languages: profile?.languages || [],

      // Availability & Capacity
      workingHours: profile?.workingHours || { dayStart: 'Monday', dayEnd: 'Friday', startTime: '09:00', endTime: '17:00' },
      breakTimes: profile?.breakTimes || [],
      maxCapacity: profile?.maxCapacity || 10,
      currentAssignments: profile?.currentAssignments || 0,

      // Company Information
      companyName: profile?.companyName || '',
      companyRegistration: profile?.companyRegistration || '',
      governmentAgencyId: profile?.governmentAgencyId || '',
      contactPerson: profile?.contactPerson || '',
      contactEmail: profile?.contactEmail || '',
      contactPhone: profile?.contactPhone || '',

      // Profile Media
      profilePictureUrl: user.avatarUrl || profile?.profilePictureUrl || '',
      videoIntroUrl: profile?.videoIntroUrl || '',

      // Statistics
      averageRating: profile?.averageRating || 0,
      successRate: profile?.successRate || 0,
      totalCandidatesCoached: profile?.totalCandidatesCoached || 0,
    };

    return NextResponse.json({ success: true, profile: profileData });
  } catch (error) {
    console.error('Get coach profile error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const body = await request.json();

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user || (user.role?.toLowerCase() !== 'coach')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Update User fields
    if (body.phone) user.phone = body.phone;
    if (body.profilePictureUrl !== undefined) {
      user.avatarUrl = body.profilePictureUrl;
    }
    await user.save();

    // Update CoachProfile fields
    let profile = await CoachProfile.findOne({ userId: decoded.userId });
    if (!profile) {
      profile = new CoachProfile({ userId: decoded.userId });
    }

    const editableFields = [
      'bio', 'expertiseAreas', 'yearsExperience', 'certifications', 'languages',
      'workingHours', 'breakTimes', 'maxCapacity', 'profilePictureUrl', 'videoIntroUrl',
      'averageRating', 'successRate', 'totalCandidatesCoached'
    ];

    editableFields.forEach(field => {
      if (body[field] !== undefined) {
        profile[field] = body[field];
      }
    });

    await profile.save();

    return NextResponse.json({ success: true, message: 'Profile updated', data: profile });
  } catch (error) {
    console.error('Update coach profile error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
