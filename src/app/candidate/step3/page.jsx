'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ai, candidate, coach } from '@/services/api';

export default function Step3Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [rankedCoaches, setRankedCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [modalCoach, setModalCoach] = useState(null);
  const [confirmingCoach, setConfirmingCoach] = useState(null);

  const storedProfile = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem('candidateProfile') || 'null');
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileResponse, coachesResult] = await Promise.all([
          fetch('/api/candidate/my-profile', { credentials: 'include' }).then((response) => response.json()).catch(() => ({ success: false })),
          coach.getAvailableCoaches().catch(() => ({ success: false })),
        ]);

        const candidateProfile = profileResponse?.data || storedProfile?.step2 || storedProfile?.step1 || {};
        const coachList = Array.isArray(coachesResult?.data)
          ? coachesResult.data
          : Array.isArray(coachesResult?.coaches)
            ? coachesResult.coaches
            : [];

        setProfile(candidateProfile);
        setCoaches(coachList);

        const matchPayload = {
          candidateProfile: {
            industryPreferences: candidateProfile.industryPreferences || [],
            location: candidateProfile.location || storedProfile?.step1?.placeOfResidence || '',
            availability: candidateProfile.preferredMeetingTimes?.[0] || '',
            skillsTags: candidateProfile.skills || [],
          },
          coachesList: coachList.map((coach) => ({
            coachId: coach.coachId || coach._id || coach.id,
            name: coach.name,
            expertiseAreas: coach.expertiseAreas || coach.specialties || [],
            companyCity: coach.companyCity || coach.city || 'Stockholm',
            rating: coach.rating || 4.5,
            successRate: coach.successRate || 80,
            currentCandidates: coach.currentCandidates || 0,
            maxCapacity: coach.maxCapacity || 15,
            languages: coach.languages || ['Swedish', 'English'],
          })),
        };

        const matchResponse = await ai.matchCoaches(matchPayload);
        const matches = Array.isArray(matchResponse?.data?.matches)
          ? matchResponse.data.matches
          : Array.isArray(matchResponse?.data)
            ? matchResponse.data
            : [];

        const ranked = matches
          .map((match) => {
            const coach = coachList.find((item) => (item.coachId || item._id || item.id) === match.coachId);
            if (!coach) return null;
            return {
              ...coach,
              coachId: match.coachId,
              rank: match.rank,
              matchScore: match.matchScore,
              reason: match.reason,
            };
          })
          .filter(Boolean);

        setRankedCoaches(ranked.length > 0 ? ranked : coachList.slice(0, 3));
      } catch (err) {
        setError(err.message || 'Unable to load coach recommendations');
      } finally {
        setAiLoading(false);
      }
    };

    loadData();
  }, [storedProfile]);

  const handleSelectCoach = async (coach) => {
    setConfirmingCoach(coach);
  };

  const confirmSelection = async () => {
    if (!confirmingCoach) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await candidate.selectCompany(confirmingCoach.coachId || confirmingCoach.id || confirmingCoach._id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to select coach');
      }

      const savedProfile = JSON.parse(localStorage.getItem('candidateProfile') || '{}');
      savedProfile.selectedCoach = confirmingCoach;
      savedProfile.selectionStatus = 'pending_acceptance';
      localStorage.setItem('candidateProfile', JSON.stringify(savedProfile));

      setSelectedCoach(confirmingCoach);
      router.push('/candidate/selection-pending');
    } catch (err) {
      setError(err.message || 'Unable to select coach');
    } finally {
      setIsLoading(false);
      setConfirmingCoach(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Step 3: Select Your Coach</h1>
              <p className="mt-2 text-gray-600">AI ranks coaches based on your profile and preferences</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Step 3 of 3</div>
              <div className="mt-2 h-2 w-32 rounded-full bg-gray-200">
                <div className="h-full w-full rounded-full bg-blue-600" />
              </div>
            </div>
          </div>

          {aiLoading && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <p className="text-sm text-blue-700">AI is ranking coaches for your profile...</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-6 rounded-lg border border-blue-200 bg-linear-to-r from-blue-50 to-purple-50 p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Your profile:</span> {profile?.currentOccupation || 'Candidate profile loaded'}
            {profile?.industryPreferences?.length ? ` • ${profile.industryPreferences.join(', ')}` : ''}
          </p>
        </div>

        <div className="grid gap-6">
          {rankedCoaches.map((coach, index) => (
            <Card key={coach.coachId || coach.id || index}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                      #{coach.rank || index + 1} Match
                    </span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                      {coach.matchScore || 0}% Match
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{coach.name}</h3>
                    <p className="text-sm text-gray-600">{coach.companyName} {coach.companyCity ? `(${coach.companyCity})` : ''}</p>
                  </div>

                  <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                    <p>⭐ {coach.rating || 4.5} ({coach.reviewsCount || 0} reviews)</p>
                    <p>📈 Success rate: {coach.successRate || 0}% placement within 6 months</p>
                    <p>👥 Currently coaching: {(coach.currentCandidates || 0)}/{coach.maxCapacity || 15} candidates</p>
                    <p>💼 Expertise: {(coach.expertiseAreas || []).join(', ')}</p>
                  </div>

                  <p className="rounded-lg bg-gray-50 p-4 text-sm italic text-gray-700">
                    {coach.testimonials?.[0] || coach.reason || 'A strong match for your profile.'}
                  </p>
                </div>

                <div className="flex flex-col gap-3 lg:w-56">
                  <Button type="button" variant="outline" onClick={() => setModalCoach(coach)}>
                    View Full Profile
                  </Button>
                  <Button type="button" variant="primary" onClick={() => handleSelectCoach(coach)}>
                    Select This Coach
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading || aiLoading}>
            Back
          </Button>
        </div>

        {modalCoach && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{modalCoach.name}</h2>
                  <p className="text-gray-600">{modalCoach.companyName}</p>
                </div>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setModalCoach(null)}>
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray-700">
                <p>{modalCoach.bio}</p>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Expertise Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {(modalCoach.expertiseAreas || []).map((item) => (
                      <span key={item} className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Availability</p>
                  <div className="space-y-1">
                    {(modalCoach.availabilitySlots || []).map((slot) => (
                      <p key={`${slot.day}-${slot.time}`}>{slot.day}: {slot.time}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Testimonials</p>
                  <p>{modalCoach.testimonials?.[0] || 'No testimonials available.'}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setModalCoach(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {confirmingCoach && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-900">Confirm Selection</h2>
              <p className="mt-3 text-gray-700">
                You are about to select <span className="font-semibold">{confirmingCoach.name}</span> as your coach.
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Once confirmed, the coach will be notified and you can start messaging after acceptance.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setConfirmingCoach(null)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" onClick={confirmSelection} disabled={isLoading}>
                  {isLoading ? 'Selecting...' : 'Confirm Selection'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
