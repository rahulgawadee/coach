'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { ai, candidate, coach } from '@/services/api';

export default function Step3Page() {
  const router = useRouter();
  const { user: authUser, loading: authLoading, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [rankedCoaches, setRankedCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [modalCoach, setModalCoach] = useState(null);
  const [confirmingCoach, setConfirmingCoach] = useState(null);

  useEffect(() => {
    if (authLoading || !authUser) return;

    // Check status for redirects
    if (authUser.status === 'new') {
      router.replace('/candidate/step1');
    } else if (authUser.status === 'eligible') {
      router.replace('/candidate/step2');
    } else if (authUser.status === 'pending_acceptance' || authUser.status === 'active') {
      router.replace('/candidate/dashboard');
    } else if (authUser.status === 'not_eligible') {
      router.replace('/candidate/not-eligible');
    }

    const loadData = async () => {
      try {
        const [profileRes, coachesRes] = await Promise.all([
          fetch('/api/candidate/profile'),
          fetch('/api/coaches/available')
        ]);

        const profileResult = await profileRes.json();
        const coachesResult = await coachesRes.json();

        if (!profileResult.success || !coachesResult.success) {
          throw new Error('Failed to load data');
        }

        const candidateProfile = profileResult.data;
        const coachList = coachesResult.data || [];

        setProfile(candidateProfile);
        setCoaches(coachList);

        const matchPayload = {
          candidateProfile: {
            industryPreferences: candidateProfile.industryPreferences || [],
            location: candidateProfile.location || '',
            availability: candidateProfile.preferredMeetingTimes?.[0] || '',
            skillsTags: candidateProfile.skills || [],
          },
          coachesList: coachList.map((c) => ({
            coachId: c.coachId || c._id || c.id,
            name: c.name,
            expertiseAreas: c.expertiseAreas || [],
            companyCity: c.companyCity || 'Stockholm',
            rating: c.rating || 4.5,
            successRate: c.successRate || 80,
            currentCandidates: c.currentCandidates || 0,
            maxCapacity: c.maxCapacity || 15,
            languages: c.languages || ['Swedish', 'English'],
          })),
        };

        const matchResponse = await ai.matchCoaches(matchPayload);
        const matches = Array.isArray(matchResponse?.data?.matches)
          ? matchResponse.data.matches
          : Array.isArray(matchResponse?.data)
            ? matchResponse.data
            : [];

        if (matches.length === 0) {
          setRankedCoaches(coachList.slice(0, 3));
        } else {
          const ranked = matches
            .map((match) => {
              const c = coachList.find((item) => (item.coachId || item._id || item.id) === match.coachId);
              if (!c) return null;
              return {
                ...c,
                rank: match.rank,
                matchScore: match.matchScore,
                reason: match.reason,
              };
            })
            .filter(Boolean);
          setRankedCoaches(ranked);
        }
      } catch (err) {
        setError(err.message || 'Unable to load coach recommendations');
      } finally {
        setAiLoading(false);
      }
    };

    loadData();
  }, [authLoading, authUser, router]);

  const handleSelectCoach = async (coach) => {
    setConfirmingCoach(coach);
  };

  const confirmSelection = async () => {
    if (!confirmingCoach) return;

    setIsLoading(true);
    setError('');

    try {
      const coachId = confirmingCoach.coachId || confirmingCoach._id || confirmingCoach.id;
      const response = await fetch('/api/candidate/select-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId }),
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to select coach');
      }

      updateUser({ status: 'pending_acceptance', onboardingStep: 4 });
      router.push('/candidate/waiting-for-coach');
    } catch (err) {
      setError(err.message || 'Unable to select coach');
    } finally {
      setIsLoading(false);
      setConfirmingCoach(null);
    }
  };

  if (authLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="max-h-[90vh] overflow-y-auto custom-scrollbar p-6 md:p-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Step 3: Select Your Coach</h1>
              <p className="mt-2 text-gray-600">AI ranks coaches based on your profile and preferences</p>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Step 3 of 3</div>
              <div className="mt-2 h-1.5 w-32 rounded-full bg-gray-100">
                <div className="h-full w-full rounded-full bg-blue-600" />
              </div>
            </div>
          </div>

          {aiLoading && (
            <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <p className="font-medium text-blue-700">AI is analyzing {coaches.length} coaches to find your best matches...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {!aiLoading && (
            <div className="mb-8 rounded-xl border border-blue-100 bg-linear-to-r from-blue-50/50 to-purple-50/50 p-5">
              <p className="text-sm text-gray-700">
                <span className="font-bold text-blue-900">Matching for:</span> {profile?.currentOccupation}
                {profile?.industryPreferences?.length ? ` • ${profile.industryPreferences.join(', ')}` : ''}
              </p>
            </div>
          )}

          <div className="grid gap-8">
            {rankedCoaches.map((coach, index) => (
              <div key={coach.coachId || coach.id || index} className="group relative rounded-2xl border-2 border-gray-100 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                        #{coach.rank || index + 1} Match
                      </span>
                      <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold text-green-700 uppercase tracking-wider">
                        {coach.matchScore || 0}% Score
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{coach.name}</h3>
                      <p className="text-gray-500 font-medium">{coach.companyName} {coach.companyCity ? `• ${coach.companyCity}` : ''}</p>
                    </div>

                    <div className="grid gap-y-2 gap-x-6 text-sm text-gray-600 md:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400 font-bold">★</span>
                        <span>{coach.rating || 4.5} <span className="text-gray-400">({coach.reviewsCount || 0})</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500 font-bold">📈</span>
                        <span>{coach.successRate || 85}% Success</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-500 font-bold">👥</span>
                        <span>{coach.currentCandidates || 0}/{coach.maxCapacity || 15} Slots</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-orange-500 font-bold">💼</span>
                        <span>{coach.expertiseAreas?.[0] || 'Expert Coach'}</span>
                      </div>
                    </div>

                    <div className="relative rounded-xl bg-gray-50 p-4 text-sm text-gray-700 border border-gray-100">
                      <span className="absolute -top-2 left-4 bg-white px-2 text-[10px] font-bold text-gray-400 uppercase">AI Recommendation</span>
                      <p className="italic leading-relaxed">
                        "{coach.reason || coach.testimonials?.[0] || 'A highly recommended coach based on your profile goals and industry preference.'}"
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:w-64">
                    <Button type="button" variant="primary" size="lg" onClick={() => handleSelectCoach(coach)} className="w-full py-4 text-sm font-bold uppercase tracking-widest">
                      Select Coach
                    </Button>
                    <Button type="button" variant="outline" size="lg" onClick={() => setModalCoach(coach)} className="w-full text-sm">
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-gray-100 pt-8">
            <button onClick={() => router.back()} disabled={isLoading || aiLoading} className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2">
              ← Go back
            </button>
            <p className="text-xs text-gray-400">Can't find a match? Contact <a href="mailto:info@swedenagency.se" className="text-blue-600">support</a></p>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {modalCoach && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-200">
                  {modalCoach.name[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{modalCoach.name}</h2>
                  <p className="font-medium text-blue-600">{modalCoach.companyName}</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-900 transition-colors p-2" onClick={() => setModalCoach(null)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">About</h4>
                <p className="text-gray-700 leading-relaxed">{modalCoach.bio || 'Professional coach dedicated to candidate success and career placement.'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {(modalCoach.expertiseAreas || []).map((item) => (
                      <span key={item} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {(modalCoach.languages || ['Swedish', 'English']).map((item) => (
                      <span key={item} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-100">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button type="button" variant="primary" onClick={() => { handleSelectCoach(modalCoach); setModalCoach(null); }} className="px-10">
                Select This Coach
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmingCoach && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 px-4 backdrop-blur-lg">
          <div className="w-full max-w-lg rounded-3xl bg-white p-10 shadow-2xl text-center animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Ready to start?</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              You are selecting <span className="font-bold text-gray-900">{confirmingCoach.name}</span>. They will review your profile and contact you for your first session.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="outline" onClick={() => setConfirmingCoach(null)} disabled={isLoading} className="flex-1 py-4">
                Wait, let me check again
              </Button>
              <Button type="button" variant="primary" onClick={confirmSelection} disabled={isLoading} className="flex-1 py-4 shadow-lg shadow-blue-200">
                {isLoading ? 'Processing...' : 'Confirm Selection'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
