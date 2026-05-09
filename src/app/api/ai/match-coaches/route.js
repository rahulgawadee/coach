import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.openai.com/v1';

function getApiKey() {
  return process.env.OPENAI_API_KEY || '';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const candidateProfile = body?.candidateProfile || {};
    const coachesList = body?.coachesList || [];
    const apiKey = getApiKey();

    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a matchmaking expert. Rank the provided coaches for the candidate. Return a JSON object with key "matches" containing an array of objects with: coachId, matchScore (1-100), rank (1-N), and reason (max 2 sentences).' 
          },
          { 
            role: 'user', 
            content: `Candidate: ${JSON.stringify(candidateProfile)}. Coaches: ${JSON.stringify(coachesList)}` 
          },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '{}';
    const cleaned = content.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleaned);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Match Coaches Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}