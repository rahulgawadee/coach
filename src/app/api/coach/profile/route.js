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
      // Personal Information (from User)
      fullName: user.name || '',
      email: user.email,
      phone: user.phone || profile?.phoneNumber || '',

      // Professional Information (from CoachProfile)
      bio: profile?.bio || '',
      expertise: profile?.expertiseAreas || [],
      yearsOfExperience: profile?.yearsOfExperience || 0,
      certifications: profile?.certifications || '',
      languages: profile?.languages || [],

      // Availability & Capacity
      preferredWorkingHours: profile?.preferredWorkingHours || { startTime: '09:00', endTime: '17:00', timezone: 'Europe/Stockholm' },
      maxCandidates: profile?.maxCandidates || 15,
      currentAssignmentCount: profile?.currentAssignmentCount || 0,

      // Company Information
      companyName: profile?.companyName || '',
      companyRegistrationNumber: profile?.companyRegistrationNumber || '',
      governmentAgencyId: profile?.governmentAgencyId || '',
      contactPersonName: profile?.contactPersonName || '',

      // Profile Media
      profilePictureUrl: user.avatarUrl || profile?.profilePictureUrl || '',
      videoIntroductionUrl: profile?.videoIntroductionUrl || '',

      // Statistics
      averageRating: profile?.averageRating || 4.9,
      reviewCount: profile?.reviewCount || 0,
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
    if (body.fullName !== undefined) user.name = body.fullName;
    if (body.phone !== undefined) user.phone = body.phone;
    if (body.profilePictureUrl !== undefined) user.avatarUrl = body.profilePictureUrl;
    await user.save();

    // Update CoachProfile fields
    let profile = await CoachProfile.findOne({ userId: decoded.userId });
    if (!profile) {
      profile = new CoachProfile({ 
        userId: decoded.userId,
        email: user.email,
        fullName: user.name || 'Coach',
        companyName: 'Techvance Partner', // Default or from body
        companyRegistrationNumber: `REG-${Date.now()}`,
        governmentAgencyId: `GA-${Date.now()}`,
        phoneNumber: user.phone || 'N/A'
      });
    }

    // Update redundant fields in profile if they exist
    if (body.fullName !== undefined) profile.fullName = body.fullName;

    const editableFields = [
      'bio', 'yearsOfExperience', 'certifications', 'languages',
      'maxCandidates', 'profilePictureUrl', 'videoIntroductionUrl',
      'preferredWorkingHours'
    ];

    editableFields.forEach(field => {
      if (body[field] !== undefined) {
        profile[field] = body[field];
      }
    });

    if (body.phone !== undefined) {
      profile.phoneNumber = body.phone;
    }

    if (body.expertise !== undefined) {
      profile.expertiseAreas = body.expertise;
    }

    await profile.save();

    return NextResponse.json({ success: true, message: 'Profile updated', profile });
  } catch (error) {
    console.error('Update coach profile error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
