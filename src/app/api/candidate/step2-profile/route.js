import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CandidateProfile from '@/models/CandidateProfile';
import CandidateEligibility from '@/models/CandidateEligibility';

function getToken(request) {
  const authHeader = request.headers.get('authorization');
  return authHeader?.split(' ')[1] || request.cookies.get('token')?.value;
}

export async function POST(request) {
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
    const user = await User.findById(userId);
    if (!user || user.role !== 'Candidate') {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    const body = await request.json();
    const eligibility = await CandidateEligibility.findOne({ userId });

    const profile = await CandidateProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        firstName: body.firstName || eligibility?.firstName || user.name?.split(' ')[0] || 'Candidate',
        lastName: body.lastName || eligibility?.lastName || '',
        currentOccupation: body.currentOccupation || '',
        educationLevel: body.educationLevel || '',
        yearsExperience: body.yearsExperience || 0,
        industryPreferences: body.industryPreferences || [],
        desiredJobType: body.desiredJobType || '',
        availableToStart: body.availableToStart || null,
        weeklyHoursAvailable: body.weeklyHoursAvailable || 0,
        preferredMeetingTimes: body.preferredMeetingTimes || [],
        skills: body.skills || [],
        topStrengths: body.topStrengths || [],
        aboutYourself: body.aboutYourself || '',
        supportNeeded: body.supportNeeded || [],
        hasPersonnummer: body.hasPersonnummer || 'No',
        hasDriverLicense: body.hasDriverLicense || 'No',
        languagesSpoken: body.languagesSpoken || [],
        location: body.location || eligibility?.placeOfResidence || '',
        eligibilityStatus: eligibility?.eligibilityStatus || 'eligible',
        profileStatus: 'profile_complete',
        aiSuggestions: body.aiSuggestions || {},
        updatedAt: new Date(),
      },
      { upsert: true, new: true, runValidators: true }
    );

    user.onboardingStep = 3;
    user.profileCompleted = true;
    user.status = 'profile_complete';
    await user.save();

    return NextResponse.json({ success: true, data: profile }, { status: 200 });
  } catch (error) {
    console.error('Step2-profile error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save profile' }, { status: 500 });
  }
}
