'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Clock, ShieldCheck, XCircle, AlertCircle, ChevronRight, User } from 'lucide-react';

const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position: 'absolute', inset: 0, background: 'var(--background)' }} />
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .035 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 72 0 L 0 0 0 72" fill="none" stroke="var(--primary)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position: 'absolute', top: '-20%', left: '-15%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter: 'blur(40px)' }} />
    <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter: 'blur(40px)' }} />
  </div>
);

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

        if (assignment.status === 'accepted') {
          updateUser({ status: 'active', onboardingStep: 5 });
          setTimeout(() => router.push('/candidate/dashboard'), 2000);
          return;
        }

        if (assignment.status === 'rejected') {
          setError(`Coach declined: ${assignment.reason || 'Not available'}`);
        }

        if (assignment.coachId && !coachInfo) {
          const coachRes = await fetch(`/api/coaches/available`);
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
    const interval = setInterval(fetchStatus, 15000);
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
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 font-['DM_Sans',sans-serif]">
      <BackgroundGrid />
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .glass-panel {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          backdrop-filter: blur(24px);
          border-radius: 32px;
        }
      `}</style>

      <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-700">
        <div className="glass-panel p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-var(--primary-glow) rounded-full blur-3xl opacity-20 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            {status === 'pending' ? (
              <>
                <div className="w-20 h-20 rounded-2xl bg-var(--primary-glow) border border-var(--primary) flex items-center justify-center mb-8 shadow-xl text-var(--primary)">
                  <Clock size={40} className="animate-pulse" />
                </div>
                <h1 className="serif text-3xl sm:text-4xl text-var(--text-primary) leading-tight mb-4">Waiting for Response</h1>
                <p className="text-var(--text-muted) text-lg font-light max-w-sm mb-10 leading-relaxed">
                  Your coach request is pending. They'll review your profile and respond shortly.
                </p>

                {coachInfo && (
                  <div className="w-full p-6 rounded-2xl bg-var(--input-bg) border border-var(--card-border) text-left mb-8 group hover:bg-var(--primary-glow) transition-all">
                    <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest mb-4 flex items-center gap-2">
                      <User size={12} className="text-var(--primary)" /> Selected Coach
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-var(--card-bg) border border-var(--card-border) flex items-center justify-center text-var(--primary) font-bold text-xl">
                        {coachInfo.fullName?.charAt(0) || coachInfo.name?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-var(--text-primary) font-bold">{coachInfo.fullName || coachInfo.name}</h3>
                        <p className="text-var(--text-muted) text-xs">{coachInfo.companyName}</p>
                      </div>
                    </div>
                    {coachInfo.bio && (
                      <p className="mt-4 text-sm text-var(--text-secondary) font-light italic leading-relaxed">
                        "{coachInfo.bio.length > 120 ? coachInfo.bio.substring(0, 120) + '...' : coachInfo.bio}"
                      </p>
                    )}
                  </div>
                )}

                <div className="w-full space-y-4 mb-8 text-left">
                  <div className="p-5 rounded-2xl border border-var(--card-border) bg-var(--card-bg)">
                    <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest mb-4">What's Next?</p>
                    <ul className="space-y-3">
                      {[
                        'Review of your career goals',
                        'Acceptance notification',
                        'Portal features activation'
                      ].map((step, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm text-var(--text-secondary) font-medium">
                          <div className="w-5 h-5 rounded-full bg-var(--primary-glow) border border-var(--primary) flex items-center justify-center text-[10px] text-var(--primary) shrink-0">
                            {idx + 1}
                          </div>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button 
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex-1 px-6 py-4 rounded-xl text-sm font-bold bg-var(--card-bg) border border-var(--card-border) text-var(--text-primary) hover:bg-var(--primary-glow) transition-all"
                  >
                    Change Coach
                  </button>
                </div>
              </>
            ) : status === 'rejected' ? (
              <>
                <div className="w-20 h-20 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-8 shadow-xl">
                  <XCircle size={40} />
                </div>
                <h1 className="serif text-3xl sm:text-4xl text-var(--text-primary) leading-tight mb-4">Request Declined</h1>
                <p className="text-var(--text-muted) text-lg font-light max-w-sm mb-10 leading-relaxed">
                  {error || 'The coach is unavailable at this time.'}
                </p>

                <div className="w-full p-6 rounded-2xl bg-var(--input-bg) border border-var(--card-border) text-left mb-8">
                  <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertCircle size={12} className="text-var(--primary)" /> Recommendation
                  </p>
                  <p className="text-sm text-var(--text-secondary) leading-relaxed">
                    Don't worry! There are many other talented coaches waiting to help you. We recommend selecting another coach from our verified list.
                  </p>
                </div>

                <button 
                  onClick={() => router.push('/candidate/step3')}
                  className="w-full px-6 py-4 rounded-xl text-sm font-bold bg-var(--primary) text-white shadow-lg shadow-var(--primary-glow) hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  Choose Another Coach <ChevronRight size={16} />
                </button>
              </>
            ) : null}

            <p className="mt-8 text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest opacity-50">
              Checking status automatically
            </p>
          </div>
        </div>
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel max-w-md w-full p-8 shadow-2xl text-center">
            <h3 className="serif text-2xl text-var(--text-primary) mb-4">Cancel Selection?</h3>
            <p className="text-var(--text-muted) text-base font-light mb-8 leading-relaxed">
              Are you sure you want to cancel this coach selection? You'll be able to choose another mentor from our verified list.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold border border-var(--card-border) text-var(--text-primary) hover:bg-var(--card-bg) transition-all"
              >
                Keep Waiting
              </button>
              <button 
                onClick={handleCancelSelection}
                disabled={cancelLoading}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
              >
                {cancelLoading ? 'Canceling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
