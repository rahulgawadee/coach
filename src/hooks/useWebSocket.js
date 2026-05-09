import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to listen for WebSocket events
 * Currently uses polling as fallback; will be upgraded to Socket.io
 * @param {string} eventName - Event to listen for
 * @param {Function} callback - Function to call when event is received
 * @param {Array} dependencies - Dependencies for useEffect
 */
export function useWebSocketEvent(eventName, callback, dependencies = []) {
  const listenerRef = useRef(null);

  useEffect(() => {
    if (!callback) return;

    listenerRef.current = callback;

    // TODO: Replace with actual WebSocket listener when Socket.io is integrated
    // For now, this is a placeholder that can be triggered by polling or other mechanisms

    return () => {
      listenerRef.current = null;
    };
  }, [callback, ...dependencies]);

  return listenerRef;
}

/**
 * Hook for multiple WebSocket event listeners
 * @param {Object} eventMap - Map of event names to callbacks
 */
export function useWebSocketEvents(eventMap) {
  const listeners = useRef({});

  useEffect(() => {
    listeners.current = eventMap;

    // TODO: Register all listeners with WebSocket server
    // for (const [eventName, callback] of Object.entries(eventMap)) {
    //   socket.on(eventName, callback);
    // }

    return () => {
      // Cleanup listeners
      // for (const eventName of Object.keys(eventMap)) {
      //   socket.off(eventName);
      // }
    };
  }, [eventMap]);

  return listeners;
}

/**
 * Hook to establish WebSocket connection
 * @param {string} url - WebSocket server URL
 * @param {Object} options - Connection options
 */
export function useWebSocketConnection(url = 'http://localhost:3000', options = {}) {
  const socketRef = useRef(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // TODO: Initialize Socket.io connection
    // import io from 'socket.io-client';
    // const socket = io(url, { ...options, reconnection: true });
    // socketRef.current = socket;

    return () => {
      // Cleanup connection
      // if (socketRef.current) {
      //   socketRef.current.disconnect();
      // }
    };
  }, [url, options]);

  return socketRef;
}
