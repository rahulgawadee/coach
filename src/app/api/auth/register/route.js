import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';

export async function POST(request) {
  try {
    await dbConnect();

    const { email, password, confirmPassword, role, name } = await request.json();
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedRole = (role || '').trim();

    // Validation
    if (!normalizedEmail || !password || !confirmPassword || !normalizedRole) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!['Candidate', 'Coach'].includes(normalizedRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Create new user
    const user = await User.create({
      email: normalizedEmail,
      password,
      role: normalizedRole,
      name: name || normalizedEmail.split('@')[0],
    });

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email, user.role);

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          onboardingStep: user.onboardingStep,
        },
        token,
      },
      { status: 201 }
    );

    // Set HTTP-only cookie (use name 'token' so other APIs can read it)
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
