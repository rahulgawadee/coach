import { NextResponse } from 'next/server';

export async function POST(request) {
  const { currentOccupation = '', industryPreferences = [] } = await request.json();
  const text = `${currentOccupation} ${industryPreferences.join(' ')}`.toLowerCase();

  const suggestions = [];
  if (text.includes('it') || text.includes('software') || text.includes('developer')) suggestions.push('Software Developer');
  if (text.includes('health')) suggestions.push('Healthcare Assistant');
  if (text.includes('finance')) suggestions.push('Financial Assistant');
  if (text.includes('construction')) suggestions.push('Construction Worker');
  if (text.includes('education')) suggestions.push('Teaching Assistant');

  const data = suggestions.length > 0 ? suggestions : ['Professional Specialist', 'Project Coordinator'];
  return NextResponse.json({ success: true, data });
}