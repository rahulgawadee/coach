'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, ExternalLink, RefreshCcw, Home, Info } from 'lucide-react';

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

export default function NotEligiblePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [prefill, setPrefill] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/candidate/eligibility-check');
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setReason(data?.reason || data?.message || 'No specific reason provided.');
        if (data?.formData) setPrefill(data.formData);
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

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

      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] mb-6 shadow-xl text-rose-500">
            <AlertCircle size={40} strokeWidth={1.5} />
          </div>
          <h1 className="serif text-4xl sm:text-5xl text-var(--text-primary) tracking-tight mb-4">Currently Not Eligible</h1>
          <p className="text-var(--text-muted) text-lg font-light max-w-md mx-auto leading-relaxed">
            Based on current requirements, you are not eligible for the Rusta och matcha program at this time.
          </p>
        </div>

        <div className="glass-panel p-8 sm:p-10 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl opacity-20 pointer-events-none" />
          
          <div className="space-y-8 relative z-10">
            <div className="p-6 rounded-2xl bg-var(--input-bg) border border-var(--card-border)">
              <h2 className="text-xs font-bold text-var(--text-muted) uppercase tracking-widest mb-4 flex items-center gap-2">
                <Info size={14} className="text-var(--primary)" /> Analysis Result
              </h2>
              <p className="text-var(--text-secondary) leading-relaxed mb-4">
                Our verification with the Swedish Employment Agency (Arbetsförmedlingen) indicates that your profile doesn't meet the current program criteria.
              </p>
              <div className="p-4 rounded-xl bg-var(--card-bg) border border-var(--card-border)">
                <p className="text-sm text-var(--text-primary) font-medium">
                  Status: <span className="text-rose-500">{loading ? 'Verifying...' : reason}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-var(--card-bg) border border-var(--card-border)">
                <h3 className="text-xs font-bold text-var(--text-primary) uppercase tracking-widest mb-4">Next Steps</h3>
                <p className="text-sm text-var(--text-secondary) font-light mb-4 leading-relaxed">
                  We recommend contacting Arbetsförmedlingen to discuss alternative programs or update your status.
                </p>
                <a 
                  href="https://www.arbetsformedlingen.se/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-var(--primary) text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-all"
                >
                  Visit Portal <ExternalLink size={12} />
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-var(--primary-glow) border border-var(--primary) border-opacity-20">
                <h3 className="text-xs font-bold text-var(--text-primary) uppercase tracking-widest mb-4">Check Back</h3>
                <p className="text-sm text-var(--text-secondary) font-light leading-relaxed">
                  Eligibility can change as your situation evolves. You're welcome to re-verify your status at any time.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/" className="w-full sm:w-auto">
            <button className="w-full px-8 py-4 rounded-xl text-sm font-bold bg-var(--card-bg) border border-var(--card-border) text-var(--text-primary) hover:bg-var(--primary-glow) transition-all flex items-center justify-center gap-2">
              <Home size={16} /> Return Home
            </button>
          </Link>
          <Link href="/candidate/step1" className="w-full sm:w-auto">
            <button className="w-full px-8 py-4 rounded-xl text-sm font-bold bg-var(--primary) text-white shadow-lg shadow-var(--primary-glow) hover:opacity-90 transition-all flex items-center justify-center gap-2">
              <RefreshCcw size={16} /> Recheck Now
            </button>
          </Link>
          {prefill && (
            <button 
              onClick={() => {
                try { localStorage.setItem('candidate_prefill', JSON.stringify(prefill)); } catch (e) {}
                router.push('/candidate/step1');
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-var(--text-muted) hover:text-var(--text-primary) transition-all"
            >
              Retry with my data
            </button>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-[0.2em] mb-4">Support & Assistance</p>
          <p className="text-sm text-var(--text-secondary) font-light">
            Questions about your eligibility? Email us at <a href="mailto:support@techvance.se" className="text-var(--primary) hover:underline">support@techvance.se</a>
          </p>
        </div>
      </div>
    </div>
  );
}
