'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error('Failed to parse stored user:', err);
          localStorage.removeItem('user');
        }
      }

      // Fetch fresh user data to ensure status is up to date
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setUser(data.user);
              localStorage.setItem('user', JSON.stringify(data.user));
            }
          } else if (response.status === 401) {
            // Token expired
            logout();
          }
        } catch (err) {
          console.error('Failed to fetch user data:', err);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const persistSession = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  /**
   * Login user with email and password
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const userData = data.user;
      persistSession(userData, data.token);

      if (userData.role?.toLowerCase() === 'candidate') {
        // Use status field for navigation (status: new, eligible, profile_complete, pending_acceptance, active, not_eligible)
        const status = userData.status || 'new';
        
        if (status === 'active') {
          router.push('/candidate/dashboard');
        } else if (status === 'pending_acceptance') {
          router.push('/candidate/waiting-for-coach');
        } else if (status === 'profile_complete') {
          router.push('/candidate/step3');
        } else if (status === 'eligible') {
          router.push('/candidate/step2');
        } else if (status === 'not_eligible') {
          router.push('/candidate/not-eligible');
        } else {
          // default: 'new' or any other status
          router.push('/candidate/step1');
        }
      } else if (userData.role?.toLowerCase() === 'coach') {
        router.push('/coach/dashboard');
      }

      return { success: true, user: userData };
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (email, password, confirmPassword, role = 'Candidate', name = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          role,
          name: name || email.split('@')[0],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      const userData = data.user;
      persistSession(userData, data.token);

      if (userData.role?.toLowerCase() === 'candidate') {
        router.push('/candidate/step1');
      } else if (userData.role?.toLowerCase() === 'coach') {
        router.push('/coach/dashboard');
      }

      return { success: true, user: userData };
    } catch (err) {
      const errorMsg = err.message || 'Registration failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout API call failed:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('candidateProfile');
      setError(null);
      router.push('/login');
    }
  };

  /**
   * Update user data
   */
  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = !!user;

  /**
   * Check if user has a specific role
   */
  const hasRole = (role) => user?.role === role;

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
