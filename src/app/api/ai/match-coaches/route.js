import { NextResponse } from 'next/server';

function calculateScore(candidateProfile, coach) {
  let score = 50;
  const candidateIndustries = candidateProfile?.industryPreferences || [];
  const coachExpertise = coach?.expertiseAreas || [];

  const industryMatches = candidateIndustries.filter((industry) => coachExpertise.includes(industry)).length;
  score += industryMatches * 15;

  if ((candidateProfile?.location || '').toLowerCase().includes((coach?.companyCity || '').toLowerCase())) score += 10;
  if (candidateProfile?.availability && coach?.availabilitySlots?.length) score += 5;
  if ((coach?.currentCandidates || 0) < (coach?.maxCapacity || 0)) score += 10;
  score += Math.round((coach?.rating || 4.5) * 3);
  score += Math.round((coach?.successRate || 80) / 10);

  return Math.max(1, Math.min(100, score));
}

export async function POST(request) {
  const body = await request.json();
  const candidateProfile = body?.candidateProfile || {};
  const coachesList = body?.coachesList || [];

  const matches = coachesList
    .map((coach) => ({
      coachId: coach.coachId,
      matchScore: calculateScore(candidateProfile, coach),
      reason: `Matches ${coach.expertiseAreas?.join(', ') || 'your profile'} with available capacity and strong placement results.`,
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return NextResponse.json({ success: true, data: { matches } });
}