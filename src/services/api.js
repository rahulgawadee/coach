// API Service Layer - Centralized fetch wrapper with error handling

const API_BASE = '/api';

function getStoredAuthToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    return window.localStorage.getItem('token') || '';
  } catch {
    return '';
  }
}

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const authToken = getStoredAuthToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    defaultHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const config = {
    ...options,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (response.status === 401) {
      // Token expired, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Call Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============ AUTHENTICATION ============
export const auth = {
  login: (email, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email, password, confirmPassword, role, name) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, confirmPassword, role, name }),
    }),

  logout: () =>
    apiCall('/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: () =>
    apiCall('/auth/me', {
      method: 'GET',
    }),
};

// ============ CANDIDATE API ============
export const candidate = {
  // Profile
  getProfile: () => apiCall('/candidate/profile', { method: 'GET' }),
  updateProfile: (data) =>
    apiCall('/candidate/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Calendar
  getCalendar: () => apiCall('/candidate/calendar', { method: 'GET' }),
  requestSession: (data) =>
    apiCall('/candidate/calendar', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Messages
  getMessages: () => apiCall('/candidate/messages', { method: 'GET' }),
  sendMessage: (data) =>
    apiCall('/candidate/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Documents
  getDocuments: () => apiCall('/candidate/documents', { method: 'GET' }),
  uploadDocument: (formData) =>
    apiCall('/candidate/documents', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }),
  deleteDocument: (fileId) =>
    apiCall('/candidate/documents', {
      method: 'DELETE',
      body: JSON.stringify({ fileId }),
    }),

  // Onboarding
  submitEligibility: (data) =>
    apiCall('/candidate/eligibility-check', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStep2Data: () =>
    apiCall('/candidate/step2-data', {
      method: 'GET',
    }),

  submitDetailedForm: (data) =>
    apiCall('/candidate/complete-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  selectCompany: (companyId) =>
    apiCall('/candidate/select-coach', {
      method: 'POST',
      body: JSON.stringify({ coachId: companyId }),
    }),

  // Companies
  getCompanies: () => apiCall('/candidate/companies', { method: 'GET' }),

  // Dashboard
  getDashboard: () => apiCall('/candidate/dashboard', { method: 'GET' }),

  // Agreement
  getAgreement: () => apiCall('/candidate/agreement', { method: 'GET' }),
  signAgreement: () =>
    apiCall('/candidate/agreement', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  // Notifications
  getNotifications: () => apiCall('/candidate/notifications', { method: 'GET' }),
  markNotificationsAsRead: () =>
    apiCall('/candidate/notifications', {
      method: 'PATCH',
      body: JSON.stringify({}),
    }),
};

// ============ COACH API ============
export const coach = {
  // Registration and profile
  register: (data) =>
    apiCall('/coach/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Candidates
  getCandidates: () => apiCall('/coach/candidates', { method: 'GET' }),
  getCandidateDetail: (candidateId) =>
    apiCall(`/coach/candidates/${candidateId}`, { method: 'GET' }),

  // Schedule
  getSchedule: () => apiCall('/coach/schedule', { method: 'GET' }),
  createSession: (data) =>
    apiCall('/coach/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSession: (sessionId, data) =>
    apiCall(`/coach/schedule/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSession: (sessionId) =>
    apiCall(`/coach/schedule/${sessionId}`, {
      method: 'DELETE',
    }),

  // Messages
  getMessages: () => apiCall('/coach/messages', { method: 'GET' }),
  sendMessage: (data) =>
    apiCall('/coach/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  broadcastAnnouncement: (data) =>
    apiCall('/coach/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Documents
  getDocuments: () => apiCall('/coach/documents', { method: 'GET' }),
  uploadDocument: (formData) =>
    apiCall('/coach/documents', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }),
  deleteDocument: (fileId, folder) =>
    apiCall('/coach/documents', {
      method: 'DELETE',
      body: JSON.stringify({ fileId, folder }),
    }),

  // Company Info
  getCompanyInfo: () => apiCall('/coach/company-info', { method: 'GET' }),
  requestCompanyEdit: (data) =>
    apiCall('/coach/company-info/edit-request', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Reports
  getReports: (candidateId, startDate, endDate) =>
    apiCall('/coach/reports', {
      method: 'POST',
      body: JSON.stringify({ candidateId, startDate, endDate }),
    }),

  // Profile
  getProfile: () => apiCall('/coach/profile', { method: 'GET' }),
  updateProfile: (data) =>
    apiCall('/coach/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadProfileMedia: (formData) =>
    apiCall('/coach/profile/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }),

  // Notifications
  getNotifications: () => apiCall('/coach/notifications', { method: 'GET' }),
  markNotificationAsRead: (notificationId) =>
    apiCall(`/coach/notifications/${notificationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ read: true }),
    }),
  markAllNotificationsAsRead: () =>
    apiCall('/coach/notifications/mark-all-read', {
      method: 'PATCH',
    }),
  deleteNotification: (notificationId) =>
    apiCall(`/coach/notifications/${notificationId}`, {
      method: 'DELETE',
    }),

  // Dashboard
  getDashboard: () => apiCall('/coach/dashboard', { method: 'GET' }),

  // Selections
  getAvailableCoaches: () => apiCall('/coaches/available', { method: 'GET' }),
  getSelectionStatus: () => apiCall('/candidate/selection-status', { method: 'GET' }),

  // Candidate Requests & Management
  getPendingRequests: () => apiCall('/coach/pending-requests', { method: 'GET' }),
  getActiveCandidates: () => apiCall('/coach/active-candidates', { method: 'GET' }),
  acceptCandidate: (assignmentId) =>
    apiCall('/coach/accept-candidate', {
      method: 'POST',
      body: JSON.stringify({ assignmentId }),
    }),
  declineCandidate: (assignmentId, reason) =>
    apiCall('/coach/decline-candidate', {
      method: 'POST',
      body: JSON.stringify({ assignmentId, reason }),
    }),
};

// ============ CANDIDATE API (Additional) ============
export const candidateAdditional = {
  getCoachInfo: () => apiCall('/candidate/get-coach', { method: 'GET' }),
};

// ============ AI API ============
export const ai = {
  callOpenAI: (action, payload) =>
    apiCall('/ai', {
      method: 'POST',
      body: JSON.stringify({ action, payload }),
    }),

  validateFormAnswers: (answers) =>
    ai.callOpenAI('validateFormAnswers', answers),

  suggestSkills: (background) =>
    ai.callOpenAI('suggestSkills', background),

  getCompanyMatches: (candidateProfile, companies) =>
    ai.callOpenAI('getCompanyMatches', { candidateProfile, companies }),

  suggestMeetingTimes: (candidateAvailability, coachSchedule) =>
    ai.callOpenAI('suggestMeetingTimes', { candidateAvailability, coachSchedule }),

  summarizeConversation: (messages) =>
    ai.callOpenAI('summarizeConversation', messages),

  enhanceProfile: (profileData) =>
    apiCall('/ai/profile-enhance', {
      method: 'POST',
      body: JSON.stringify(profileData),
    }),

  suggestOccupation: (payload) =>
    apiCall('/ai/suggest-occupation', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  suggestStrengths: (payload) =>
    apiCall('/ai/suggest-strengths', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  enhanceBio: (payload) =>
    apiCall('/ai/enhance-bio', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  matchCoaches: (payload) =>
    apiCall('/ai/match-coaches', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ============ DEFAULT EXPORT ============
export default {
  auth,
  candidate,
  candidateAdditional,
  coach,
  ai,
};
