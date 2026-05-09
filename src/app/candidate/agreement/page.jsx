"use client";

import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
        alert('Agreement signed');
        setSignOpen(false);
        router.refresh();
        // Reload to update status
        window.location.reload();
      } else {
        alert(payload?.message || 'Failed to sign');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (loading && !agreement.text) {
    return <div className="p-8 text-center animate-pulse">Loading agreement details...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mentorship Agreement</h1>
          <p className="text-sm text-gray-500 mt-1">Official contract for the Rusta och matcha program</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${agreement.signed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {agreement.signed ? '✅ Signed' : '⏳ Pending Signature'}
          </span>
          {agreement.signedAt && (
            <div className="text-xs text-gray-400 font-medium">
              Effective since {new Date(agreement.signedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 relative">
        <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed">
          {agreement.contentHtml ? (
            <div dangerouslySetInnerHTML={{ __html: agreement.contentHtml }} />
          ) : (
            <div className="whitespace-pre-line">
              {agreement.text || 'Mentorship agreement details are being generated. Please check back in a moment.'}
            </div>
          )}
        </div>

        <div className="mt-10 pt-8 border-t border-gray-100 flex flex-wrap gap-4 items-center">
          {!agreement.signed ? (
            <Button variant="primary" size="lg" onClick={openSign} className="px-10">
              Review & Sign Agreement
            </Button>
          ) : (
            <div className="flex gap-3">
              <a href={`/api/candidate/agreement/pdf?email=${encodeURIComponent(user?.email)}`} target="_blank" rel="noreferrer">
                <Button variant="outline" className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download PDF
                </Button>
              </a>
              <Button variant="ghost" disabled>
                Signed on {new Date(agreement.signedAt).toLocaleDateString()}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={signOpen}
        onClose={() => setSignOpen(false)}
        title="Digital Signature"
        actions={[
          { label: 'Cancel', variant: 'outline', onClick: () => setSignOpen(false) },
          { label: 'Confirm & Sign', variant: 'primary', onClick: submitSign },
        ]}
      >
        <div className="space-y-6 py-2">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-900 leading-relaxed">
            <strong>Legal Confirmation:</strong>
            <p className="mt-2">By signing this document, you agree to participate in the Rusta och matcha program and acknowledge the roles and responsibilities outlined in the agreement.</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={agreeChecked} 
              onChange={(e) => setAgreeChecked(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
              I have read and agree to all terms and conditions specified in the Mentorship Agreement.
            </span>
          </label>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Full Legal Name</label>
            <input 
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-blue-500 focus:outline-none transition-all" 
              placeholder="Type your full name"
              value={signatureName} 
              onChange={(e) => setSignatureName(e.target.value)} 
            />
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">This counts as your electronic signature</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
