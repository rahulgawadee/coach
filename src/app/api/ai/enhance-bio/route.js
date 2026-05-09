import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.openai.com/v1';

function getApiKey() {
  return process.env.OPENAI_API_KEY || '';
}

export async function POST(request) {
  try {
    const { bio = '', skills = [] } = await request.json();
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
          { role: 'system', content: 'You are a career coach. Enhance the user bio to make it more professional, including their skills. Return JSON with key "bio".' },
          { role: 'user', content: `Bio: ${bio}. Skills: ${skills.join(', ')}` },
        ],
        temperature: 0.7,
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}