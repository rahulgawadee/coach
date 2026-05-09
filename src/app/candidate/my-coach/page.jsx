'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';

export default function CandidateMyCoachPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState(null);
  const [candidateData, setCandidateData] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.email) return;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const emailParam = `?email=${encodeURIComponent(user.email)}`;
        
        // Fetch candidate profile to get assigned coach ID and status
        const profileRes = await fetch(`/api/candidate/profile${emailParam}`);
        const profilePayload = await profileRes.json();
        
        if (profilePayload?.success) {
          setCandidateData(profilePayload.data);
          
          // If a coach is assigned, fetch their details
          if (profilePayload.data?.assignedCoachId || profilePayload.data?.coachId) {
            const coachId = profilePayload.data.assignedCoachId || profilePayload.data.coachId;
            const coachRes = await fetch(`/api/coach/details?id=${coachId}`);
            const coachPayload = await coachRes.json();
            if (coachPayload?.success) {
              setCoach(coachPayload.data);
            }
          }
        }
      } catch (err) {
        console.error('Error loading coach data:', err);
        setError('Failed to load coach information');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const submitReview = async () => {
    if (!coach || !user?.email) return;
    try {
      const res = await fetch('/api/candidate/coach-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          coachId: coach.id || coach._id, 
          rating, 
          comment, 
          email: user.email 
        }),
      });
      if (res.ok) {
        alert('Review submitted! Thank you.');
        setReviewOpen(false);
      }
    } catch (err) {
      alert('Failed to submit review');
    }
  };

  const requestChange = async () => {
    const reason = prompt('Please provide a reason for the coach change request:');
    if (!reason || !user?.email) return;

    try {
      await fetch('/api/candidate/coach-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, reason }),
      });
      setChangeOpen(false);
      alert('Your request for a coach change has been submitted for review.');
    } catch (err) {
      alert('Failed to submit request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading your coach profile...</p>
        </div>
      </div>
    );
  }

  if (!coach && candidateData?.status === 'pending_acceptance') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          ⏳
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Selection Pending</h2>
        <p className="mt-4 text-gray-600 text-lg leading-relaxed">
          You have requested to work with a coach. We are currently waiting for them to review your profile and accept the request.
        </p>
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-500">
          We usually hear back within 24-48 hours. You'll receive an email once it's confirmed!
        </div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          🤝
        </div>
        <h2 className="text-2xl font-bold text-gray-900">No Coach Assigned</h2>
        <p className="mt-4 text-gray-600 text-lg leading-relaxed">
          You haven't selected a coach yet. Please head to your dashboard to see recommended matches.
        </p>
        <Button className="mt-8 px-10" onClick={() => (window.location.href = '/candidate/dashboard')}>
          Find a Coach
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Profile Section */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-xl shadow-blue-900/5 p-8">
        <div className="absolute top-0 right-0 p-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700">
            ✅ Active Mentor
          </span>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <img 
              src={coach.avatar || '/avatar-placeholder.png'} 
              alt={coach.name} 
              className="h-32 w-32 md:h-40 md:w-40 rounded-3xl object-cover shadow-2xl border-4 border-white" 
            />
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.348-3.595A7.2 7.2 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{coach.name}</h1>
              <p className="text-blue-600 font-bold text-lg mt-1">{coach.title || 'Senior Career Coach'}</p>
              <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                <div className="flex items-center gap-1 text-yellow-500 font-bold">
                  <span>★</span>
                  <span className="text-gray-900">{coach.rating || 4.9}</span>
                  <span className="text-gray-400 font-medium">({coach.reviewCount || 15})</span>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <div className="text-gray-500 text-sm font-medium">
                  {coach.yearsExperience || 8}+ Years Experience
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {(coach.expertiseAreas || coach.expertise || []).map((tag) => (
                <span key={tag} className="rounded-xl bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 border border-blue-100 uppercase tracking-wide">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <Button variant="primary" size="lg" className="w-full" onClick={() => (window.location.href = '/candidate/messages')}>
              Send Message
            </Button>
            <Button variant="outline" size="lg" onClick={() => setReviewOpen(true)}>
              Share Feedback
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* About Section */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6 uppercase tracking-wider text-sm">
              <span className="text-blue-600">●</span> Background & Approach
            </h4>
            <p className="text-gray-700 leading-relaxed text-lg italic">
              "{coach.bio || "I am dedicated to helping candidates find their true potential and landing the job they deserve. With years of experience in recruitment and career coaching, I focus on practical strategies that work in the Swedish market."}"
            </p>
          </div>

          {/* Specializations Section */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6 uppercase tracking-wider text-sm">
              <span className="text-blue-600">●</span> Specializations
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'CV/Resume Optimization', score: 98 },
                { label: 'Interview Techniques', score: 95 },
                { label: 'Networking in Sweden', score: 92 },
                { label: 'Skill Gap Analysis', score: 88 },
              ].map(item => (
                <div key={item.label} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-700">{item.label}</span>
                    <span className="text-xs text-blue-600 font-bold">{item.score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Certifications & Languages */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Details</h4>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Languages</label>
                <div className="flex flex-wrap gap-2">
                  {(coach.languages || ['Swedish', 'English']).map((l) => (
                    <span key={l} className="bg-gray-50 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium border border-gray-100">{l}</span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Certifications</label>
                <div className="space-y-2">
                  {(coach.certifications || ['ICF Certified Coach', 'Senior HR Specialist']).map((c) => (
                    <div key={c} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-blue-600 text-lg">🎖</span> {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Change Request */}
          <div className="bg-red-50 rounded-3xl p-6 border border-red-100">
            <p className="text-xs text-red-600 font-medium leading-relaxed">
              Not feeling the match? You can request a different coach if your needs have changed.
            </p>
            <button 
              onClick={requestChange}
              className="mt-4 text-sm font-bold text-red-700 hover:text-red-800 underline transition-colors"
            >
              Request a Change →
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title={`Review ${coach.name}`}
        actions={[
          { label: 'Cancel', variant: 'outline', onClick: () => setReviewOpen(false) },
          { label: 'Submit Review', variant: 'primary', onClick: submitReview },
        ]}
      >
        <div className="space-y-6 py-2">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Overall Rating</label>
            <div className="flex gap-4 items-center">
              <input 
                type="range" min="1" max="5" value={rating} 
                onChange={(e) => setRating(Number(e.target.value))} 
                className="flex-1 accent-blue-600"
              />
              <span className="text-2xl font-bold text-blue-600">{rating} ★</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Your Experience</label>
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="What do you like about working with this coach?"
              className="w-full rounded-2xl border-2 border-gray-200 p-4 focus:border-blue-500 focus:outline-none transition-all h-32" 
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
