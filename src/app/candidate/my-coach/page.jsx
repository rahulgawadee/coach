'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function CandidateMyCoachPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

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
    if (!email) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/candidate/profile?email=${encodeURIComponent(email)}`);
        const payload = await res.json();
        if (payload?.success) setCoach(payload.coach || payload.data || null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [email]);

  const submitReview = async () => {
    if (!coach) return;
    await fetch('/api/candidate/coach-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coachId: coach.id, rating, comment, email }),
    });

    setReviewOpen(false);
  };

  const requestChange = async (reason) => {
    await fetch('/api/candidate/coach-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, reason }),
    });
    setChangeOpen(false);
    alert('Coach change request submitted');
  };

  if (loading) return <div className="animate-pulse">Loading coach...</div>;

  if (!coach) return <div>No coach assigned yet.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-4">
          <img src={coach.avatar || '/avatar-placeholder.png'} alt="coach" className="h-24 w-24 rounded-full object-cover" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{coach.name}</h3>
            <p className="text-sm text-gray-600">{coach.title || 'Career Coach'}</p>
            <p className="mt-2 text-sm text-gray-700">Rating: {coach.rating || '—'} • {coach.yearsExperience || 0} yrs experience</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(coach.expertise || []).map((tag) => (
                <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">{tag}</span>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={() => setReviewOpen(true)}>Write Review</Button>
            <Button variant="outline" onClick={() => setChangeOpen(true)}>Request Coach Change</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Certifications & Languages</h4>
          <div className="mt-3 flex flex-wrap gap-3">
            {(coach.certifications || []).map((c) => (
              <div key={c} className="rounded border px-3 py-1 text-sm text-gray-700">{c}</div>
            ))}
            {(coach.languages || []).map((l) => (
              <div key={l} className="rounded border px-3 py-1 text-sm text-gray-700">{l}</div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">About</h4>
          <p className="mt-2 text-sm text-gray-700">{coach.bio || '—'}</p>
        </div>
      </Card>

      <Modal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title={`Review ${coach.name}`}
        actions={[
          { label: 'Cancel', variant: 'outline', onClick: () => setReviewOpen(false) },
          { label: 'Submit', variant: 'primary', onClick: submitReview },
        ]}
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Rating</label>
          <input type="range" min="1" max="5" value={rating} onChange={(e) => setRating(Number(e.target.value))} />
          <label className="block text-sm font-medium text-gray-700">Comment</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full rounded border p-2" />
        </div>
      </Modal>

      <Modal
        isOpen={changeOpen}
        onClose={() => setChangeOpen(false)}
        title="Request Coach Change"
        actions={[
          { label: 'Cancel', variant: 'outline', onClick: () => setChangeOpen(false) },
          { label: 'Send Request', variant: 'primary', onClick: () => requestChange(prompt('Why do you want to change coach?')) },
        ]}
      >
        <p className="text-sm text-gray-700">We'll notify the team and try to match you with another coach. Include a short reason for the request.</p>
      </Modal>
    </div>
  );
}
