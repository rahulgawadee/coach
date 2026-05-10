import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import CandidateProfile from '@/models/CandidateProfile';
import CandidateEligibility from '@/models/CandidateEligibility';
import User from '@/models/User';

function getToken(request) {
  const authHeader = request.headers.get('authorization');
  return authHeader?.split(' ')[1] || request.cookies.get('token')?.value;
}

export async function GET(request) {
  try {
    await dbConnect();

    const token = getToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const verification = verifyToken(token);
    if (!verification.valid) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const userId = verification.userId;
    
    // Fetch profile and eligibility data
    const [profile, eligibility, user] = await Promise.all([
      CandidateProfile.findOne({ userId }).lean(),
      CandidateEligibility.findOne({ userId }).lean(),
      User.findById(userId)
    ]);

    // Construct response data
    const data = {
      firstName: profile?.firstName || eligibility?.firstName || user?.name?.split(' ')[0] || '',
      lastName: profile?.lastName || eligibility?.lastName || user?.name?.split(' ').slice(1).join(' ') || '',
      email: user?.email || '',
      currentOccupation: profile?.currentOccupation || '',
      educationLevel: profile?.educationLevel || '',
      yearsExperience: profile?.yearsExperience || 0,
      industryPreferences: profile?.industryPreferences || [],
      desiredJobType: profile?.desiredJobType || '',
      availableToStart: profile?.availableToStart || null,
      weeklyHoursAvailable: profile?.weeklyHoursAvailable || 0,
      preferredMeetingTimes: profile?.preferredMeetingTimes || [],
      skills: profile?.skills || [],
      topStrengths: profile?.topStrengths || [],
      aboutYourself: profile?.aboutYourself || '',
      supportNeeded: profile?.supportNeeded || [],
      hasPersonnummer: profile?.hasPersonnummer || 'No',
      hasDriverLicense: profile?.hasDriverLicense || 'No',
      languagesSpoken: profile?.languagesSpoken || [],
      location: profile?.location || eligibility?.placeOfResidence || '',
      status: user?.status || 'new',
      phone: profile?.phone || '',
      address: profile?.address || '',
      videoUrl: profile?.videoUrl || '',
      avatarUrl: profile?.avatarUrl || '',
      employmentStatus: profile?.employmentStatus || 'Unemployed',
      marketingConsent: profile?.marketingConsent || false,
      dataConsent: profile?.dataConsent || false,
      startDate: profile?.programStartDate ? new Date(profile.programStartDate).toISOString().split('T')[0] : '',
      finishDate: profile?.programFinishDate ? new Date(profile.programFinishDate).toISOString().split('T')[0] : '',
      industries: profile?.industryPreferences || []
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();

    const token = getToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const verification = verifyToken(token);
    if (!verification.valid) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const userId = verification.userId;
    const body = await request.json();

    const updateData = {
      firstName: body.firstName || 'Candidate',
      lastName: body.lastName || 'Profile',
      phone: body.phone || '',
      address: body.address || '',
      videoUrl: body.videoUrl,
      avatarUrl: body.avatarUrl,
      employmentStatus: body.employmentStatus,
      marketingConsent: body.marketingConsent,
      dataConsent: body.dataConsent,
      industryPreferences: body.industries || [],
      skills: body.skills || [],
      updatedAt: new Date()
    };
    
    console.log('PUT /api/candidate/profile - updateData:', updateData);

    if (body.startDate) updateData.programStartDate = new Date(body.startDate);
    if (body.finishDate) updateData.programFinishDate = new Date(body.finishDate);
    if (body.personnummer) updateData.hasPersonnummer = body.personnummer;

    const profile = await CandidateProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true, strict: false }
    );

    // Also update User name if needed
    if (body.firstName || body.lastName) {
      const name = `${body.firstName || ''} ${body.lastName || ''}`.trim();
      await User.findByIdAndUpdate(userId, { name });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Put profile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

