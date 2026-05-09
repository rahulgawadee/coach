import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.openai.com/v1';

export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, profile } = body;

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        data: {
          skills: ['Communication', 'Problem Solving', 'Teamwork'],
          bio:
            `Hi, I am ${firstName || 'a candidate'} and I am actively growing my professional skills with support from my coach.`,
        },
      });
    }

    const prompt = `Enhance this candidate profile. Return valid JSON with keys skills (array of 5 strings) and bio (string).
Profile:\n${JSON.stringify(profile || {}, null, 2)}`;

    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You improve candidate profiles for mentorship programs.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI request failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        skills: ['Communication', 'Problem Solving', 'Teamwork'],
        bio: content,
      };
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
