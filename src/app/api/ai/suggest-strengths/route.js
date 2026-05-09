import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.openai.com/v1';

function getApiKey() {
  return process.env.OPENAI_API_KEY || '';
}

export async function POST(request) {
  try {
    const { occupation = '', experience = 0 } = await request.json();
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
          { role: 'system', content: 'You are a career coach. Suggest exactly 3 professional strengths for the given occupation and experience. Return ONLY a JSON array of strings.' },
          { role: 'user', content: `Occupation: ${occupation}, Experience: ${experience} years` },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '[]';
    
    // Clean potential markdown and parse
    const cleaned = content.replace(/```json|```/g, '').trim();
    const strengths = JSON.parse(cleaned);

    return NextResponse.json({ success: true, data: strengths });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}