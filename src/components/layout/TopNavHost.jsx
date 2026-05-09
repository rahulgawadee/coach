'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import { useAuth } from '@/context/AuthContext';

const PUBLIC_NAV_PATHS = ['/', '/login', '/signup', '/coach/login'];

export default function TopNavHost({ role = 'candidate' }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAuthPage = PUBLIC_NAV_PATHS.includes(pathname);
  const shouldShowNavbar = isAuthPage || !user;

  if (!shouldShowNavbar) return null;

  return <Navbar role={role} minimal={isAuthPage} />;
}
