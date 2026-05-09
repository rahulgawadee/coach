'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export default function CoachShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  if (pathname === '/coach/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // ignore
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="coach" isOpen={isOpen} onToggle={() => setIsOpen((prev) => !prev)} onLogout={handleLogout} />
      <main className={`min-h-screen transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'}`}>
        {children}
      </main>
    </div>
  );
}