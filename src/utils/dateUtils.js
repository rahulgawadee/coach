export function formatDate(dateInput) {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(dateInput) {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysUntil(dateInput) {
  if (!dateInput) return null;
  const now = new Date();
  const date = new Date(dateInput);
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getWeekDates(referenceDate = new Date()) {
  const date = new Date(referenceDate);
  const day = date.getDay() || 7;
  if (day !== 1) date.setHours(-24 * (day - 1));
  return Array.from({ length: 5 }, (_, index) => {
    const next = new Date(date);
    next.setDate(date.getDate() + index);
    return next;
  });
}

export function formatMonth(dateInput) {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function nextSessionFromEvents(events = []) {
  const upcoming = events
    .filter((event) => event?.start)
    .map((event) => ({ ...event, startTime: new Date(event.start).getTime() }))
    .filter((event) => event.startTime > Date.now())
    .sort((a, b) => a.startTime - b.startTime);

  return upcoming[0] || null;
}
