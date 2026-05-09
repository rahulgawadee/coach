"use client";
import React, { useEffect, useState } from 'react';
import Sidebar from '../../../../src/components/layout/Sidebar';
import Navbar from '../../../../src/components/layout/Navbar';
import Modal from '../../../../src/components/ui/Modal';
import Button from '../../../../src/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function AgreementPage() {
  const [agreement, setAgreement] = useState({ signed: false, dateSigned: null, text: '' });
  const [loading, setLoading] = useState(true);
  const [signOpen, setSignOpen] = useState(false);
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setEmail(parsed?.email || '');
    } catch {
      setEmail('');
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const url = email ? `/api/candidate/agreement?email=${encodeURIComponent(email)}` : '/api/candidate/agreement';
        const res = await fetch(url);
        const payload = await res.json();
        if (payload?.success) setAgreement(payload.data || {});
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [email]);

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
        body: JSON.stringify({ email, signatureName }),
      });
      const payload = await res.json();
      if (payload?.success) {
        alert('Agreement signed');
        setSignOpen(false);
        router.refresh();
      } else {
        alert(payload?.message || 'Failed to sign');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Mentorship Agreement</h1>
              <p className="text-sm text-gray-600 mt-1">Agreement between <strong>{agreement?.candidateName || 'Candidate'}</strong> and <strong>{agreement?.coachName || 'Coach'}</strong></p>
            </div>
            <div className="text-right">
              <span className={`rounded-full px-3 py-1 text-sm ${agreement.signed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {agreement.signed ? 'Signed' : 'Pending'}
              </span>
              {agreement.signedAt && <div className="text-xs text-gray-500 mt-1">Signed: {new Date(agreement.signedAt).toLocaleDateString()}</div>}
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
            <div className="whitespace-pre-line text-gray-700 leading-7">
              {agreement.contentHtml ? (
                <div dangerouslySetInnerHTML={{ __html: agreement.contentHtml }} />
              ) : (
                agreement.text || 'Agreement content not available.'
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 items-center">
              {!agreement.signed ? (
                <button type="button" className="rounded bg-blue-600 px-4 py-2 text-white" onClick={openSign}>
                  Sign Agreement
                </button>
              ) : (
                <>
                  <a href={`/api/candidate/agreement/pdf?email=${encodeURIComponent(email)}`}>
                    <Button variant="outline">Download PDF</Button>
                  </a>
                  <a href={`/candidate/agreement/view?signed=true`} className="ml-3 text-sm text-blue-600">View Signed Copy</a>
                </>
              )}
            </div>
          </div>

          <Modal
            isOpen={signOpen}
            onClose={() => setSignOpen(false)}
            title="Sign Agreement"
            actions={[
              { label: 'Cancel', variant: 'outline', onClick: () => setSignOpen(false) },
              { label: 'Sign and Submit', variant: 'primary', onClick: submitSign },
            ]}
          >
            <div className="space-y-3">
              <div className="rounded border bg-gray-50 p-3 text-sm text-gray-800">
                <strong>Summary</strong>
                <div className="mt-2" dangerouslySetInnerHTML={{ __html: agreement.summaryHtml || (agreement.text || '').slice(0, 800) }} />
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={agreeChecked} onChange={(e) => setAgreeChecked(e.target.checked)} />
                <span className="text-sm">I have read and agree to the terms</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type full name (digital signature)</label>
                <input className="w-full rounded border px-3 py-2" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} />
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  );
}
