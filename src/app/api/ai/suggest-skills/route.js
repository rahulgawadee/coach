import { NextResponse } from 'next/server';

export async function POST(request) {
  const { industryPreferences = [], currentOccupation = '' } = await request.json();
  const text = `${currentOccupation} ${industryPreferences.join(' ')}`.toLowerCase();

  const skills = ['Communication', 'Problem Solving', 'Teamwork'];
  if (text.includes('it') || text.includes('developer')) skills.unshift('JavaScript', 'React');
  if (text.includes('finance')) skills.unshift('Excel', 'Analysis');
  if (text.includes('health')) skills.unshift('Patient Support', 'Care Coordination');

  return NextResponse.json({ success: true, data: skills.slice(0, 5).map((skill) => ({ skill })) });
}