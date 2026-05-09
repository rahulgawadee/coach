import { NextResponse } from 'next/server';

export async function POST(request) {
  const { occupation = '', experience = 0 } = await request.json();
  const base = occupation.toLowerCase();

  const strengths = [];
  if (base.includes('developer')) strengths.push('Problem Solving', 'Technical Thinking', 'Adaptability');
  else if (base.includes('manager')) strengths.push('Leadership', 'Planning', 'Communication');
  else strengths.push('Communication', 'Teamwork', 'Reliability');

  if (Number(experience) > 5) strengths.unshift('Experience and Judgment');

  return NextResponse.json({ success: true, data: strengths.slice(0, 3) });
}