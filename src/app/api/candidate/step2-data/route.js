import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CandidateProfile from '@/models/CandidateProfile';

export async function GET(request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let userId;
    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'Candidate') {
      return NextResponse.json(
        { success: false, error: 'User not found or not a candidate' },
        { status: 404 }
      );
    }

    // Try to find existing profile
    const profile = await CandidateProfile.findOne({ userId });

    if (profile) {
      // Return existing profile data
      return NextResponse.json(
        {
          success: true,
          profile: {
            currentOccupation: profile.currentOccupation || '',
            educationLevel: profile.educationLevel || '',
            yearsExperience: profile.yearsExperience || '',
            industryPreferences: profile.industryPreferences || [],
            desiredJobType: profile.desiredJobType || '',
            availableToStart: profile.availableToStart ? profile.availableToStart.toISOString().split('T')[0] : '',
            weeklyHoursAvailable: profile.weeklyHoursAvailable || '',
            preferredMeetingTimes: profile.preferredMeetingTimes || [],
            skills: profile.skills ? profile.skills.join(', ') : '',
            topStrengths: profile.topStrengths ? profile.topStrengths.join(', ') : '',
            aboutYourself: profile.aboutYourself || '',
            supportNeeded: profile.supportNeeded || [],
            hasPersonnummer: profile.hasPersonnummer || 'No',
            hasDriverLicense: profile.hasDriverLicense || 'No',
            languagesSpoken: profile.languagesSpoken || [],
          },
        },
        { status: 200 }
      );
    } else {
      // Return empty form template
      return NextResponse.json(
        {
          success: true,
          profile: null,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Step2 data fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}
