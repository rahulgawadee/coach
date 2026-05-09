'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import Link from 'next/link';

export default function CandidateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, hasRole } = useAuth();
  const [authToken] = useLocalStorage('token', '');
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Coach')) {
      router.push('/coach/login');
      return;
    }

    const fetchCandidate = async () => {
      try {
        const response = await fetch(`/api/coach/candidates/${params.id}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/coach/login');
            return;
          }
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setCandidate(data.candidate);
        } else {
          setError(data.error || 'Failed to load candidate');
        }
      } catch (err) {
        console.error('Candidate detail error:', err);
        setError('Failed to load candidate details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCandidate();
    }
  }, [isAuthenticated, hasRole, authToken, router, params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading candidate details...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/coach/candidates" className="text-blue-600 hover:text-blue-800 mb-6 inline-block">
            ← Back to Candidates
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700">{error || 'Candidate not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Link */}
        <Link href="/coach/candidates" className="text-blue-600 hover:text-blue-800 mb-6 inline-block">
          ← Back to Candidates
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{candidate.name}</h1>
            <p className="text-gray-600 mt-1">{candidate.email} • {candidate.phone}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full font-semibold ${
              candidate.status === 'active'
                ? 'bg-green-100 text-green-700'
                : candidate.status === 'completed'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
          </span>
        </div>

        {/* Candidate Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Candidate Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-lg font-semibold text-gray-900">{candidate.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="text-lg font-semibold text-gray-900">{candidate.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Key Person Number</p>
              <p className="text-lg font-semibold text-gray-900">{candidate.keyPersonNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="text-lg font-semibold text-gray-900">{candidate.startDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Finish Date</p>
              <p className="text-lg font-semibold text-gray-900">{candidate.finishDate || 'TBD'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Overall Progress</p>
              <p className="text-lg font-semibold text-gray-900">{candidate.progress}%</p>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Progress Tracker</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900">Sessions Completed</p>
                <p className="text-sm text-gray-600">
                  {candidate.sessionsCompleted || 0} / {candidate.totalSessions || 10}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{
                    width: `${((candidate.sessionsCompleted || 0) / (candidate.totalSessions || 10)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900">Documents Uploaded</p>
                <p className="text-sm text-gray-600">{candidate.documentsUploaded || 0} files</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{
                    width: `${Math.min(((candidate.documentsUploaded || 0) / 5) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900">Assignments Done</p>
                <p className="text-sm text-gray-600">{candidate.assignmentsDone || 0} / 5</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full"
                  style={{
                    width: `${((candidate.assignmentsDone || 0) / 5) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
            📅 View Calendar
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition">
            💬 Message
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition">
            📄 Documents
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition">
            📈 History
          </button>
        </div>
      </div>
    </div>
  );
}
