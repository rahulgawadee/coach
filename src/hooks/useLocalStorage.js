"use client";

import { useEffect, useState } from 'react';

export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [hydrated, setHydrated] = useState(false);

  // Initial load
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        // Try to parse as JSON, if it fails, use the raw string
        try {
          setValue(JSON.parse(stored));
        } catch {
          setValue(stored);
        }
      }
    } catch (err) {
      console.error(`Error reading localStorage key "${key}":`, err);
    }
    setHydrated(true);
  }, [key]);

  // Persist changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (value === undefined) {
        window.localStorage.removeItem(key);
      } else {
        // If it's a string, we might want to save it raw to avoid extra quotes, 
        // but for consistency with the getter, we use JSON.stringify for everything
        // unless it's already a string and we want to keep it raw.
        // To be safe and compatible with other parts of the app:
        const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
        window.localStorage.setItem(key, valueToStore);
      }
    } catch (err) {
      console.error(`Error writing localStorage key "${key}":`, err);
    }
  }, [hydrated, key, value]);

  return [value, setValue];
}
