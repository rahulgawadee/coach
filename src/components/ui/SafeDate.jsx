'use client';

import { useState, useEffect } from 'react';

/**
 * A component that safely renders a date string only after hydration
 * to prevent SSR mismatch errors.
 */
export default function SafeDate({ date, format = 'toLocaleString', options = {} }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !date) {
    return <span>{date ? '...' : ''}</span>;
  }

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return <span>Invalid date</span>;
    
    if (format === 'toLocaleDateString') {
      return <span>{d.toLocaleDateString(undefined, options)}</span>;
    }
    return <span>{d.toLocaleString(undefined, options)}</span>;
  } catch (err) {
    return <span>{String(date)}</span>;
  }
}
