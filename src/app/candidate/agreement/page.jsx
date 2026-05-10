"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FileSignature, ShieldCheck, Download, AlertCircle, FileText, CheckCircle2, X } from 'lucide-react';

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

export default function AgreementPage() {
  const { user } = useAuth();
  const [agreement, setAgreement] = useState({ signed: false, dateSigned: null, text: '' });
  const [loading, setLoading] = useState(true);
  const [signOpen, setSignOpen] = useState(false);
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!user?.email) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/candidate/agreement?email=${encodeURIComponent(user.email)}`);
        const payload = await res.json();
        if (payload?.success) setAgreement(payload.data || {});
      } catch (e) {
        console.error('Load agreement error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const openSign = () => {
    setAgreeChecked(false);
    setSignatureName('');
    setSignOpen(true);
  };

  const submitSign = async () => {
    if (!agreeChecked) return alert('Please confirm you have read the agreement');
    if (!signatureName.trim()) return alert('Please enter your name as a digital signature');

    try {
      const res = await fetch('/api/candidate/agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, signatureName }),
      });
      const payload = await res.json();
      if (payload?.success) {
        setSignOpen(false);
        router.refresh();
        window.location.reload();
      } else {
        alert(payload?.message || 'Failed to sign');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (loading && !agreement.text) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid rgba(99,102,241,0.15)', borderTop:'1.5px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className="relative max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-500 font-['DM_Sans',sans-serif]">
      <BackgroundGrid />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .glass-panel {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(24px);
          border-radius: 24px;
        }
        .btn-primary {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 28px; border-radius: 14px;
          font-size: 14px; font-weight: 700; cursor: pointer; border: none;
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color: #fff; box-shadow: 0 4px 20px rgba(99,102,241,0.25);
          transition: all 0.2s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(99,102,241,0.35); }
        .btn-outline {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 24px; border-radius: 14px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          color: #e2e8f0; transition: all 0.2s;
        }
        .btn-outline:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
        .document-text {
          font-size: 15px; line-height: 1.8; color: #cbd5e1; font-weight: 300;
        }
        .document-text h1, .document-text h2, .document-text h3 { color: #fff; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; }
        .document-text p { margin-bottom: 1em; }
        .document-text strong { color: #fff; font-weight: 600; }
        .document-text ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .document-text li { margin-bottom: 0.5em; }
      `}</style>

      {/* Header */}
      <div className="glass-panel p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-black/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-4">
            <FileSignature size={12} />
            Official Contract
          </div>
          <h1 className="serif text-3xl md:text-4xl text-white leading-tight mb-2">Mentorship Agreement</h1>
          <p className="text-slate-400 font-light text-sm">Review and sign your program terms and conditions.</p>
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          {agreement.signed ? (
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <CheckCircle2 size={16} /> Signed
              </span>
              {agreement.signedAt && (
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                  Effective {new Date(agreement.signedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <AlertCircle size={16} /> Pending Signature
            </span>
          )}
        </div>
      </div>

      {/* Document Viewer */}
      <div className="glass-panel p-8 md:p-12 shadow-xl shadow-black/20">
        <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
          `}</style>
          
          <div className="document-text">
            {agreement.contentHtml ? (
              <div dangerouslySetInnerHTML={{ __html: agreement.contentHtml }} />
            ) : (
              <div className="whitespace-pre-line">
                {agreement.text || 'Mentorship agreement details are being generated. Please check back in a moment.'}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 flex flex-wrap gap-4 items-center justify-end">
          {!agreement.signed ? (
            <button className="btn-primary" onClick={openSign}>
              <FileSignature size={18} /> Review & Sign Agreement
            </button>
          ) : (
            <div className="flex gap-4 items-center">
              <span className="text-xs text-emerald-400/80 font-bold uppercase tracking-widest flex items-center gap-2 px-4">
                <ShieldCheck size={16} /> Signed by {agreement.signatureName || user?.name}
              </span>
              <a href={`/api/candidate/agreement/pdf?email=${encodeURIComponent(user?.email)}`} target="_blank" rel="noreferrer">
                <button className="btn-outline">
                  <Download size={18} /> Download PDF
                </button>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      {signOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f0e1c] border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.6)] rounded-3xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileSignature size={18} className="text-indigo-400" />
                  Digital Signature
                </h3>
                <p className="text-xs text-slate-400 mt-1">Please confirm to proceed.</p>
              </div>
              <button onClick={() => setSignOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm text-blue-200 leading-relaxed font-light shadow-inner flex items-start gap-3">
                <ShieldCheck size={20} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-300 font-bold mb-1 block">Legal Confirmation</strong>
                  By signing this document, you agree to participate in the Rusta och matcha program and acknowledge the roles and responsibilities outlined in the agreement.
                </div>
              </div>

              <label className="flex items-start gap-4 cursor-pointer group p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                  <input 
                    type="checkbox" 
                    checked={agreeChecked} 
                    onChange={(e) => setAgreeChecked(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 appearance-none checked:bg-indigo-500 checked:border-indigo-500 transition-colors cursor-pointer"
                  />
                  {agreeChecked && <CheckCircle2 size={14} className="text-white absolute pointer-events-none" strokeWidth={3} />}
                </div>
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors font-light leading-relaxed">
                  I have read and agree to all terms and conditions specified in the Mentorship Agreement.
                </span>
              </label>

              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                  Full Legal Name
                </label>
                <div className="relative">
                  <input 
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:bg-white/10 transition-all outline-none font-medium" 
                    placeholder="Type your full name"
                    value={signatureName} 
                    onChange={(e) => setSignatureName(e.target.value)} 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <FileText size={18} className="text-slate-500" />
                  </div>
                </div>
                <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest pl-1 opacity-80">
                  This counts as your electronic signature
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
              <button className="btn-outline !w-auto" onClick={() => setSignOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary !w-auto" onClick={submitSign}>
                Confirm & Sign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
