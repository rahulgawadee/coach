import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are Elevate Assistant, a helpful AI assistant for the Elevate mentorship platform.
You help users with:
- Finding and connecting with coaches/mentors.
- Understanding onboarding steps.
- Navigating their dashboard.
- Managing sessions, schedules, and messages.

Platform knowledge:
- Finding a coach: AI matches users with the best coach based on goals. Users complete profile steps 1-3 and get matched within 48 hours. They can view matches in 'My Coach' in the sidebar.
- Booking a session: From the Calendar or My Coach page.
- Messaging: In the Messages sidebar.
- Documents: Handled in the Documents section.
- Profile: Top-right avatar -> Profile.
- Jobs: Coming soon.
- Human support: Users can click the WhatsApp button.

Tone: Professional, warm, encouraging, use emojis occasionally. Keep responses concise and formatted with markdown (bullet points, bold text). If asked something unrelated to the platform, politely redirect them back to the platform.`;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key missing" }, { status: 500 });
    }

    const formattedMessages = messages.map(m => ({
      role: m.from === 'bot' ? 'assistant' : 'user',
      content: m.text
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...formattedMessages
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      return NextResponse.json({ reply: data.choices[0].message.content });
    } else {
      return NextResponse.json({ error: "Failed to generate reply", details: data }, { status: 500 });
    }

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
