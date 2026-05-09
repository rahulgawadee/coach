async function callAi(action, payload) {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'AI request failed');
  }

  return data.data;
}

export async function validateFormAnswers(answers) {
  return callAi('validate-form', { answers });
}

export async function getCompanyMatches(candidateProfile, companies) {
  return callAi('company-matches', { candidateProfile, companies });
}

export async function suggestSkills(userData) {
  return callAi('suggest-skills', { userData });
}

export async function suggestMeetingTimes(calendarData) {
  return callAi('suggest-meeting-times', { calendarData });
}

export async function summarizeConversation(messages) {
  return callAi('summarize-conversation', { messages });
}
