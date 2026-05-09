import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CandidateEligibility from '@/models/CandidateEligibility';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

// Simulated Swedish Employment Agency API check
// In production, this would call the actual government API
async function checkSwedishEmploymentAgencyEligibility(candidateData) {
  try {
    // For now, we'll simulate the check
    // In production: call actual SEA API with candidateData
    
    // Eligibility rules:
    // 1. Must be registered with SEA
    // 2. Must be eligible for Rusta och matcha (or "Don't know")
    // 3. Must be looking for job or training
    
    const eligible = 
      candidateData.registeredWithSEA === 'Yes' &&
      (candidateData.eligibleForRustaOchMatcha === 'Yes' || candidateData.eligibleForRustaOchMatcha === 'Dont know') &&
      candidateData.lookingForJobOrTraining === 'Yes';

    if (!eligible) {
      let reason = '';
      if (candidateData.registeredWithSEA !== 'Yes') {
        reason = 'Not registered with Swedish Employment Agency';
      } else if (candidateData.eligibleForRustaOchMatcha === 'No') {
        reason = 'Not eligible for Rusta och matcha program';
      } else if (candidateData.lookingForJobOrTraining !== 'Yes') {
        reason = 'Not currently looking for job or training';
      }

      return {
        eligible: false,
        reason,
      };
    }

    return {
      eligible: true,
      reason: 'All eligibility criteria met',
    };
  } catch (error) {
    console.error('SEA eligibility check error:', error);
    throw new Error('Failed to check eligibility with Swedish Employment Agency');
  }
}

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
    if (!user || user.role !== 'Candidate') {
      return NextResponse.json(
        { success: false, error: 'User not found or not a candidate' },
        { status: 404 }
      );
    }

    const {
      firstName,
      lastName,
      yearOfBirth,
      phoneNumber,
      placeOfResidence,
      registeredWithSEA,
      eligibleForRustaOchMatcha,
      lookingForJobOrTraining,
      wouldYouLikeUsToCall,
      whereDidYouHearAboutUs,
      consentHelloLilly,
      consentPrivacy,
    } = await request.json();

    // Validation
    if (!firstName || !lastName || !yearOfBirth || !phoneNumber || !placeOfResidence ||
        !registeredWithSEA || !eligibleForRustaOchMatcha || !lookingForJobOrTraining ||
        !wouldYouLikeUsToCall || !whereDidYouHearAboutUs) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!consentHelloLilly || !consentPrivacy) {
      return NextResponse.json(
        { success: false, error: 'Must accept both consent agreements' },
        { status: 400 }
      );
    }

    // Check eligibility with Swedish Employment Agency
    const seaCheckResult = await checkSwedishEmploymentAgencyEligibility({
      registeredWithSEA,
      eligibleForRustaOchMatcha,
      lookingForJobOrTraining,
    });

    // Determine final eligibility status
    const eligibilityStatus = seaCheckResult.eligible ? 'eligible' : 'not-eligible';

    // Create or update candidate eligibility record
    let candidateEligibility = await CandidateEligibility.findOne({ userId });

    if (candidateEligibility) {
      // Update existing record
      candidateEligibility = await CandidateEligibility.findByIdAndUpdate(
        candidateEligibility._id,
        {
          firstName,
          lastName,
          yearOfBirth,
          phoneNumber,
          placeOfResidence,
          registeredWithSEA,
          eligibleForRustaOchMatcha,
          lookingForJobOrTraining,
          wouldYouLikeUsToCall,
          whereDidYouHearAboutUs,
          consentHelloLilly,
          consentPrivacy,
          eligibilityStatus,
          eligibilityReason: seaCheckResult.reason,
          eligibilityCheckedAt: new Date(),
          seaCheckResult,
          updatedAt: new Date(),
        },
        { new: true }
      );
    } else {
      // Create new record
      candidateEligibility = new CandidateEligibility({
        userId,
        email: user.email,
        firstName,
        lastName,
        yearOfBirth,
        phoneNumber,
        placeOfResidence,
        registeredWithSEA,
        eligibleForRustaOchMatcha,
        lookingForJobOrTraining,
        wouldYouLikeUsToCall,
        whereDidYouHearAboutUs,
        consentHelloLilly,
        consentPrivacy,
        eligibilityStatus,
        eligibilityReason: seaCheckResult.reason,
        eligibilityCheckedAt: new Date(),
        seaCheckResult,
      });

      await candidateEligibility.save();
    }

    // Update user onboarding step
    if (eligibilityStatus === 'eligible') {
      user.onboardingStep = 2; // Move to step 2 (candidate details)
    } else {
      user.onboardingStep = -1; // Mark as not eligible
    }
    await user.save();

    return NextResponse.json(
      {
        success: true,
        data: {
          eligibilityStatus,
          eligible: seaCheckResult.eligible,
          reason: seaCheckResult.reason,
          candidateEligibilityId: candidateEligibility._id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Eligibility check error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check eligibility' },
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

    // Get candidate eligibility
    const candidateEligibility = await CandidateEligibility.findOne({ userId });

    if (!candidateEligibility) {
      return NextResponse.json(
        { success: false, error: 'Eligibility check not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: candidateEligibility,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get eligibility error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get eligibility status' },
      { status: 500 }
    );
  }
}
