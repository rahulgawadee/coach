import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CoachProfile from '@/models/CoachProfile';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function POST(request) {
  try {
    await dbConnect();

    // Verify authentication
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

    // Get user
    const user = await User.findById(userId);
    if (!user || user.role !== 'Coach') {
      return NextResponse.json(
        { success: false, error: 'User not found or not a coach' },
        { status: 404 }
      );
    }

    const {
      email,
      fullName,
      phoneNumber,
      companyName,
      companyRegistrationNumber,
      governmentAgencyId,
      bio,
      expertiseAreas,
      yearsOfExperience,
      certifications,
      contactPersonName,
      maxCandidates,
      preferredWorkingHours,
      agreeToTermsOfService,
      confirmedRegisteredSupplier,
    } = await request.json();

    // Validation
    if (!email || !fullName || !phoneNumber || !companyName || !companyRegistrationNumber ||
        !governmentAgencyId || !bio || !expertiseAreas || expertiseAreas.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!agreeToTermsOfService || !confirmedRegisteredSupplier) {
      return NextResponse.json(
        { success: false, error: 'Must agree to all agreements' },
        { status: 400 }
      );
    }

    // Check if coach profile already exists
    const existingProfile = await CoachProfile.findOne({ userId });
    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: 'Coach profile already exists' },
        { status: 400 }
      );
    }

    // Check for duplicate company registration number and government ID
    const existingCompany = await CoachProfile.findOne({
      $or: [
        { companyRegistrationNumber },
        { governmentAgencyId },
      ],
    });

    if (existingCompany) {
      return NextResponse.json(
        { success: false, error: 'Company registration number or government ID already registered' },
        { status: 400 }
      );
    }

    // Create coach profile
    const coachProfile = new CoachProfile({
      userId,
      email: email.toLowerCase(),
      fullName,
      phoneNumber,
      companyName,
      companyRegistrationNumber,
      governmentAgencyId,
      bio,
      expertiseAreas,
      yearsOfExperience,
      certifications: certifications || '',
      contactPersonName: contactPersonName || '',
      maxCandidates: maxCandidates || 15,
      preferredWorkingHours: preferredWorkingHours || {
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'Europe/Stockholm',
      },
      agreeToTermsOfService,
      confirmedRegisteredSupplier,
      status: 'pending', // Will be 'verified' after manual review by admin
    });

    await coachProfile.save();

    // Update user profile completed status
    user.profileCompleted = true;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Coach profile created successfully',
        data: {
          coachProfile: {
            id: coachProfile._id,
            fullName: coachProfile.fullName,
            email: coachProfile.email,
            status: coachProfile.status,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Coach registration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create coach profile' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect();

    // Verify authentication
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

    // Get coach profile
    const coachProfile = await CoachProfile.findOne({ userId }).populate('userId', 'email name');

    if (!coachProfile) {
      return NextResponse.json(
        { success: false, error: 'Coach profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: coachProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get coach profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get coach profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();

    // Verify authentication
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

    const updates = await request.json();

    // Find and update coach profile
    const coachProfile = await CoachProfile.findOneAndUpdate(
      { userId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!coachProfile) {
      return NextResponse.json(
        { success: false, error: 'Coach profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Coach profile updated successfully',
        data: coachProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update coach profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update coach profile' },
      { status: 500 }
    );
  }
}
