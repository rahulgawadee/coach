import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CandidateProfile from '@/models/CandidateProfile';
import CandidateWorkspace from '@/models/CandidateWorkspace';

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'Candidate') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const profile = await CandidateProfile.findOne({ userId: decoded.userId }).lean();
    const workspace = await CandidateWorkspace.findOne({ userId: decoded.userId }).lean();

    const profileData = {
      // Personal Information
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      personnummer: user.personnummer || '',

      // Program Information
      startDate: profile?.startDate || '',
      finishDate: profile?.finishDate || '',
      coachName: workspace?.coach?.name || '',
      companyName: workspace?.coach?.company || '',

      // Video Profile
      videoUrl: profile?.videoUrl || '',

      // Professional Information
      occupation: profile?.occupation || '',
      educationLevel: profile?.educationLevel || '',
      yearsExperience: profile?.yearsExperience || 0,
      industrialFields: profile?.industrialFields || [],
      skills: profile?.skills || [],
      employmentStatus: profile?.employmentStatus || '',

      // Bio
      bio: profile?.bio || '',

      // Goals & Support
      shortTermGoal: profile?.shortTermGoal || '',
      longTermGoal: profile?.longTermGoal || '',
      supportNeeded: profile?.supportNeeded || [],

      // Eligibility & Consents
      registeredWithAgency: profile?.registeredWithAgency || false,
      eligibleForRustaMatcha: profile?.eligibleForRustaMatcha || null,
      marketingConsent: profile?.marketingConsent || false,
      dataProcessingConsent: profile?.dataProcessingConsent || false,

      // Profile completeness
      completeness: calculateProfileCompleteness(profile),
    };

    return NextResponse.json({ success: true, data: profileData });
  } catch (error) {
    console.error('Get candidate profile error:', error);
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
    if (!user || user.role !== 'Candidate') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    // Update User model fields
    if (body.firstName) user.firstName = body.firstName;
    if (body.lastName) user.lastName = body.lastName;
    if (body.phone) user.phone = body.phone;
    if (body.address) user.address = body.address;
    await user.save();

    // Update CandidateProfile fields
    let profile = await CandidateProfile.findOne({ userId: decoded.userId });
    if (!profile) {
      profile = new CandidateProfile({ userId: decoded.userId });
    }

    const profileFields = [
      'occupation', 'educationLevel', 'yearsExperience', 'industrialFields', 'skills',
      'employmentStatus', 'bio', 'shortTermGoal', 'longTermGoal', 'supportNeeded',
      'marketingConsent', 'dataProcessingConsent', 'videoUrl', 'finishDate'
    ];

    profileFields.forEach(field => {
      if (body[field] !== undefined) {
        profile[field] = body[field];
      }
    });

    await profile.save();

    return NextResponse.json({ success: true, message: 'Profile updated', data: profile });
  } catch (error) {
    console.error('Update candidate profile error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

function calculateProfileCompleteness(profile) {
  if (!profile) return 0;

  const fields = [
    profile.firstName, profile.lastName, profile.phone, profile.occupation,
    profile.educationLevel, profile.bio, profile.skills?.length > 0, profile.videoUrl
  ];

  const completed = fields.filter(f => f).length;
  return Math.round((completed / fields.length) * 100);
}
