import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verifyToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const verification = verifyToken(token);
    if (!verification.valid) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'techvance_candidate_intros';
    const use_filename = searchParams.get('use_filename') || 'true';
    const unique_filename = searchParams.get('unique_filename') || 'false';
    const type = searchParams.get('type') || 'upload';

    const timestamp = Math.round((new Date).getTime()/1000);

    const signature = cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      folder: folder,
      use_filename: use_filename,
      unique_filename: unique_filename,
      type: type
    }, process.env.CLOUDINARY_API_SECRET);

    return NextResponse.json({ 
      success: true, 
      timestamp, 
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });
  } catch (error) {
    console.error('Cloudinary sign error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate signature' }, { status: 500 });
  }
}
