import { NextResponse } from 'next/server';

export async function POST(request) {
  const { bio = '', skills = [] } = await request.json();
  const enhanced = `${bio.trim()} I bring strengths in ${skills.slice(0, 4).join(', ')} and I am focused on achieving my next career goal.`.trim();
  return NextResponse.json({ success: true, data: { bio: enhanced } });
}