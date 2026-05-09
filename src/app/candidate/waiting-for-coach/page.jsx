'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function WaitingForCoachPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [coachInfo, setCoachInfo] = useState(null);
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (authLoading || !authUser) return;

    // Check status for initial redirects
    if (authUser.status === 'new') {
      router.replace('/candidate/step1');
    } else if (authUser.status === 'eligible') {
      router.replace('/candidate/step2');
    } else if (authUser.status === 'profile_complete') {
      router.replace('/candidate/step3');
    } else if (authUser.status === 'active') {
      router.replace('/candidate/dashboard');
    }

    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/candidate/selection-status');
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Failed to fetch status');

        const assignment = result.data;

        if (!assignment || assignment.status === 'none') {
          setError('No coach selection found. Redirecting to selection...');
          setTimeout(() => router.push('/candidate/step3'), 2000);
          return;
        }

        setStatus(assignment.status);

        // If coach accepted, update global state and redirect
        if (assignment.status === 'accepted') {
          updateUser({ status: 'active', onboardingStep: 5 });
          setTimeout(() => router.push('/candidate/dashboard'), 1500);
          return;
        }

        if (assignment.status === 'rejected') {
          setError(`Coach declined: ${assignment.reason || 'Not available'}`);
        }

        // Get coach info if not already loaded
        if (assignment.coachId && !coachInfo) {
          const coachRes = await fetch(`/api/coaches/available`); // Using list to find our coach
          const coachResult = await coachRes.json();
          if (coachResult.success) {
            const ourCoach = coachResult.data.find(c => (c.coachId || c._id || c.id) === assignment.coachId);
            if (ourCoach) setCoachInfo(ourCoach);
          }
        }
      } catch (err) {
        console.error('Status check error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // 15s polling fallback

    return () => clearInterval(interval);
  }, [authLoading, authUser, router, coachInfo, updateUser]);

  const handleCancelSelection = async () => {
    setCancelLoading(true);
    setError('');

    try {
      const response = await fetch('/api/candidate/cancel-selection', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to cancel selection');

      updateUser({ status: 'profile_complete', onboardingStep: 3 });
      router.push('/candidate/step3');
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm overflow-auto py-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 my-8 max-h-[90vh] overflow-y-auto">
        {status === 'pending' && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <div className="animate-spin">⏳</div>
              </div>
              <h1 className="text-2xl font-bold mb-2">Waiting for Response</h1>
              <p className="text-gray-600">
                Your coach request is pending. They'll review your profile and respond soon.
              </p>
            </div>

            {coachInfo && (
              <Card className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Your Selected Coach</h3>
                <p className="text-gray-700 font-medium">{coachInfo.fullName || coachInfo.name}</p>
                <p className="text-gray-600 text-sm">{coachInfo.companyName}</p>
                {coachInfo.bio && (
                  <p className="text-gray-600 text-sm mt-3 italic">"{coachInfo.bio}"</p>
                )}
              </Card>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-blue-700">
                <strong>What happens next:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Coach reviews your profile</li>
                  <li>Coach accepts or declines your request</li>
                  <li>You'll be notified immediately</li>
                  <li>Upon acceptance, you can start your journey!</li>
                </ul>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500 mb-6">
              <p>Auto-refreshing every 10 seconds...</p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowCancelConfirm(true)}
                variant="outline"
                disabled={cancelLoading}
                className="flex-1"
              >
                Choose Another Coach
              </Button>
            </div>
          </>
        )}

        {status === 'rejected' && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <span className="text-2xl">❌</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">Request Declined</h1>
              <p className="text-gray-600">
                {error || 'The coach is unavailable at this time.'}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-blue-700">
                <strong>What to do next:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Review other coaches</li>
                  <li>Select a different coach</li>
                  <li>Try again with someone else</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={() => router.push('/candidate/step3')}
              className="w-full"
            >
              Choose Another Coach →
            </Button>
          </>
        )}

        {loading && status === 'pending' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading status...</p>
          </div>
        )}

        {error && status !== 'rejected' && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Cancel Selection?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this coach selection? You'll be able to choose another coach.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowCancelConfirm(false)}
                variant="outline"
                disabled={cancelLoading}
                className="flex-1"
              >
                Keep Waiting
              </Button>
              <Button
                onClick={handleCancelSelection}
                disabled={cancelLoading}
                variant="primary"
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {cancelLoading ? 'Canceling...' : 'Yes, Cancel'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
