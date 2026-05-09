'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import apiService from '@/services/api';

export default function SelectionPendingPage() {
  const router = useRouter();
  const [status, setStatus] = useState('pending_acceptance');
  const [coachName, setCoachName] = useState('your coach');
  const [error, setError] = useState('');

  useEffect(() => {
    let timer;

    const pollStatus = async () => {
      try {
        const response = await apiService.candidateAdditional.getCoachInfo();
        
        if (response.success && response.hasCoach) {
          setCoachName(response.data.coachName);
          setStatus('accepted');
          // Auto-redirect to dashboard after a small delay so user sees the message
          setTimeout(() => {
            router.push('/candidate/dashboard');
          }, 1500);
        }
      } catch (err) {
        console.error('Error checking coach status:', err);
        setError('Unable to check selection status right now.');
      }
    };

    pollStatus();
    timer = setInterval(pollStatus, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleCancel = async () => {
    try {
      localStorage.removeItem('candidateProfile');
      router.push('/candidate/step3');
    } catch {
      setError('Unable to cancel selection.');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <Card>
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
              ⏳
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Your selection has been sent to {coachName}!
              </h1>
              <p className="mt-3 text-gray-600">
                {status === 'accepted' ? '✓ Coach has accepted you!' : 'Waiting for coach acceptance...'}
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
              <p className="font-semibold text-gray-900 mb-2">What happens next:</p>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
                <li>The coach reviews your profile</li>
                <li>The coach accepts or requests more information</li>
                <li>You get access to messaging, calendar and document sharing</li>
              </ol>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="font-semibold text-gray-900">Status: {status.replace(/_/g, ' ')}</p>
              <p className="mt-1 text-sm text-gray-600">This page checks automatically every 10 seconds.</p>
            </div>

            {error && <p className="text-sm text-red-700">{error}</p>}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel Selection
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => router.push('/candidate/dashboard')}
                disabled={status !== 'accepted'}
              >
                {status === 'accepted' ? 'Go to Dashboard' : 'Waiting...'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
