'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ShieldCheck, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import apiService from '@/services/api';

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
          setTimeout(() => {
            router.push('/candidate/dashboard');
          }, 2000);
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
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-xl ${status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-var(--primary-glow) text-var(--primary) border border-var(--primary)'}`}>
              {status === 'accepted' ? <CheckCircle2 size={40} /> : <Clock size={40} className="animate-pulse" />}
            </div>

            <h1 className="serif text-3xl sm:text-4xl text-var(--text-primary) leading-tight mb-4">
              {status === 'accepted' ? 'Connection Confirmed!' : `Selection Sent!`}
            </h1>
            
            <p className="text-var(--text-muted) text-lg font-light max-w-sm mb-10 leading-relaxed">
              {status === 'accepted' 
                ? `${coachName} has accepted your request. Redirecting you to your workspace...` 
                : `We've notified ${coachName}. They'll review your profile and get back to you shortly.`}
            </p>

            <div className="w-full space-y-4 mb-10">
              <div className="p-5 rounded-2xl bg-var(--input-bg) border border-var(--card-border) text-left group hover:bg-var(--primary-glow) transition-all">
                <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ShieldCheck size={12} className="text-var(--primary)" /> Next Steps
                </p>
                <ul className="space-y-3">
                  {[
                    'Profile review by coach',
                    'Confirmation of availability',
                    'Full portal access unlocked'
                  ].map((step, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-var(--text-secondary) font-medium">
                      <div className="w-5 h-5 rounded-full bg-var(--card-bg) border border-var(--card-border) flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </div>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl border border-var(--card-border) flex items-center justify-between text-xs font-bold uppercase tracking-widest text-var(--text-muted)">
                <span>Current Status</span>
                <span className="text-var(--primary)">{status.replace(/_/g, ' ')}</span>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
                <XCircle size={16} /> {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button 
                onClick={handleCancel}
                className="flex-1 px-6 py-4 rounded-xl text-sm font-bold bg-var(--card-bg) border border-var(--card-border) text-var(--text-primary) hover:bg-var(--primary-glow) transition-all"
              >
                Cancel Request
              </button>
              <button 
                disabled={status !== 'accepted'}
                onClick={() => router.push('/candidate/dashboard')}
                className="flex-1 px-6 py-4 rounded-xl text-sm font-bold bg-var(--primary) text-white shadow-lg shadow-var(--primary-glow) hover:opacity-90 disabled:opacity-40 disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
              >
                {status === 'accepted' ? (
                  <>Go to Dashboard <ChevronRight size={16} /></>
                ) : (
                  <>Waiting for Coach...</>
                )}
              </button>
            </div>

            <p className="mt-8 text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest opacity-50">
              Checking for updates every 10 seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
