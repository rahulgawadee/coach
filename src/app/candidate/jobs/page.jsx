'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Rocket, Briefcase, Zap, Globe, Sparkles } from 'lucide-react';

const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,#06060f 0%,#090912 50%,#07070e 100%)' }} />
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.035 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#6366f1" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(79,70,229,0.07) 0%, transparent 70%)', filter:'blur(40px)' }} />
    <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(14,116,144,0.06) 0%, transparent 70%)', filter:'blur(40px)' }} />
  </div>
);

export default function CandidateJobsPage() {
  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
      <BackgroundGrid />
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .glass-panel {
          background: rgba(255,255,255,0.015);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(24px);
          border-radius: 32px;
        }
        .btn-primary {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 16px 32px; border-radius: 16px;
          font-size: 14px; font-weight: 700; cursor: pointer; border: none;
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color: #fff; box-shadow: 0 4px 20px rgba(99,102,241,0.25);
          transition: all 0.2s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(99,102,241,0.35); }
        .feature-card {
          padding: 24px; border-radius: 20px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.3s;
        }
        .feature-card:hover { transform: translateY(-4px); background: rgba(255,255,255,0.04); border-color: rgba(99,102,241,0.2); }
      `}</style>

      <div className="max-w-3xl w-full space-y-12">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em] mb-4">
            <Sparkles size={12} className="animate-pulse" />
            Coming Soon
          </div>
          
          <h1 className="serif text-5xl md:text-6xl text-white leading-tight">
            The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 italic">Job Matching</span>
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
            We're building an AI-powered job board that connects you with opportunities that perfectly match your skills, values, and career goals.
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-6 pt-8">
          {[
            { icon: Rocket, title: "AI Matching", desc: "Our algorithm finds jobs you'll actually love." },
            { icon: Globe, title: "Global Reach", desc: "Remote and local roles from top tech companies." },
            { icon: Zap, title: "Direct Connect", desc: "Skip the line and connect with hiring managers." }
          ].map((item, i) => (
            <div key={i} className="feature-card group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-all">
                <item.icon size={22} className="text-indigo-400" />
              </div>
              <h3 className="text-white font-bold text-sm mb-2">{item.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Action */}
        <div className="pt-8">
          <Link href="/candidate/dashboard" className="btn-primary inline-flex">
            Back to Dashboard <Rocket size={18} />
          </Link>
        </div>
      </div>

      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-20">
        <div className="absolute inset-0 rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>
    </div>
  );
}
