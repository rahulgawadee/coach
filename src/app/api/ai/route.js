import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.openai.com/v1';

function getApiKey() {
  return process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
}

function mockResponse(action, payload) {
  if (action === 'company-matches') {
    const companies = payload?.companies || [];
    return companies.slice(0, 3).map((company, index) => ({
      companyId: company.id,
      matchScore: 98 - index * 4,
      reason: 'Strong fit based on your profile',
    }));
  }

  if (action === 'suggest-skills') {
    return [
      { skill: 'Communication', priority: 'high', reason: 'Useful in nearly every role' },
      { skill: 'Problem Solving', priority: 'high', reason: 'Helps you adapt quickly' },
      { skill: 'Teamwork', priority: 'medium', reason: 'Supports collaboration' },
    ];
  }

  if (action === 'validate-form') {
    return {
      missingFields: [],
      incompleteFields: [],
      issues: [],
      suggestions: ['Your form looks complete.'],
    };
  }

  if (action === 'suggest-meeting-times') {
    return [{ day: 'Tuesday', time: '10:00', reason: 'Fits common working patterns' }];
  }

  if (action === 'summarize-conversation') {
    return 'Conversation summary is not available in mock mode.';
  }

  return null;
}

async function callOpenAi(prompt) {
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
        { role: 'system', content: 'You are a helpful AI assistant for a mentorship platform.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    const mock = mockResponse(action, payload);
    if (!getApiKey() && mock !== null) {
      return NextResponse.json({ success: true, data: mock });
    }

    let prompt = '';
    if (action === 'validate-form') {
      prompt = `Analyze form answers for completeness and return JSON with missingFields, incompleteFields, issues, suggestions. Answers: ${JSON.stringify(payload?.answers || {}, null, 2)}`;
    } else if (action === 'company-matches') {
      prompt = `Rank the following companies for the candidate and return JSON array with companyId, matchScore, reason. Candidate: ${JSON.stringify(payload?.candidateProfile || {}, null, 2)}. Companies: ${JSON.stringify(payload?.companies || [], null, 2)}`;
    } else if (action === 'suggest-skills') {
      prompt = `Suggest the top 5 skills for this user and return JSON array with skill, priority, reason. User data: ${JSON.stringify(payload?.userData || {}, null, 2)}`;
    } else if (action === 'suggest-meeting-times') {
      prompt = `Suggest optimal meeting times and return JSON array with day, time, reason. Calendar data: ${JSON.stringify(payload?.calendarData || {}, null, 2)}`;
    } else if (action === 'summarize-conversation') {
      prompt = `Summarize this conversation in 2-3 sentences. Messages: ${JSON.stringify(payload?.messages || [], null, 2)}`;
    } else {
      return NextResponse.json({ success: false, error: 'Unknown AI action' }, { status: 400 });
    }

    const data = await callOpenAi(prompt);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'AI request failed' }, { status: 500 });
  }
}
