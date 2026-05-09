// WebSocket Events Registry
// This defines all real-time events emitted by the system

export const WEBSOCKET_EVENTS = {
  // Session Events
  SESSION_REQUEST_CREATED: 'session_request_created',
  SESSION_REQUEST_CANCELLED: 'session_request_cancelled',
  SESSION_APPROVED: 'session_approved',
  SESSION_DECLINED: 'session_declined',
  SESSION_CREATED: 'session_created',
  SESSION_UPDATED: 'session_updated',
  SESSION_CANCELLED: 'session_cancelled',

  // Availability Events
  COACH_AVAILABILITY_BLOCKED: 'coach_availability_blocked',

  // Message Events
  NEW_MESSAGE: 'new_message',
  NEW_ANNOUNCEMENT: 'new_announcement',
  MESSAGE_MARKED_READ: 'message_marked_read',

  // Document Events
  DOCUMENT_SHARED: 'document_shared',
  DOCUMENT_DELETED: 'document_deleted',

  // Connection Events
  USER_CONNECTED: 'user_connected',
  USER_DISCONNECTED: 'user_disconnected',
};

/**
 * Emit a WebSocket event
 * @param {string} eventName - Event name from WEBSOCKET_EVENTS
 * @param {Object} data - Event data to emit
 * @param {string} targetEmail - Email of user to target (optional)
 * @param {string} targetRole - Role to target 'candidate' or 'coach' (optional)
 */
export async function emitEvent(eventName, data, targetEmail = null, targetRole = null) {
  try {
    // For now, this is a placeholder that logs events
    // In production, this would connect to a WebSocket server or emit to connected clients
    console.log(`[WEBSOCKET EVENT] ${eventName}:`, {
      timestamp: new Date().toISOString(),
      target: targetEmail || targetRole || 'broadcast',
      data,
    });

    // TODO: Integrate with actual WebSocket server (Socket.io or native)
    // socket.to(targetEmail || targetRole).emit(eventName, data);
  } catch (error) {
    console.error(`Failed to emit event ${eventName}:`, error);
  }
}

/**
 * Emit candidate-specific event
 */
export async function emitCandidateEvent(eventName, data, candidateEmail) {
  return emitEvent(eventName, data, candidateEmail);
}

/**
 * Emit coach-specific event
 */
export async function emitCoachEvent(eventName, data, coachEmail) {
  return emitEvent(eventName, data, coachEmail);
}

/**
 * Broadcast event to all users
 */
export async function broadcastEvent(eventName, data) {
  return emitEvent(eventName, data, null, 'broadcast');
}
