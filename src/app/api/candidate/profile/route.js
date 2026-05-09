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
      CandidateProfile.findOne({ userId }),
      CandidateEligibility.findOne({ userId }),
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
      status: user?.status || 'new'
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
