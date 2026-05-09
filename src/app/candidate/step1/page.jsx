'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

export default function Step1Page() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    yearOfBirth: '',
    phoneNumber: '',
    placeOfResidence: '',
    registeredWithSEA: '',
    eligibleForRustaOchMatcha: '',
    lookingForJobOrTraining: '',
    wouldYouLikeUsToCall: '',
    whereDidYouHearAboutUs: '',
    consentHelloLilly: false,
    consentPrivacy: false,
  });
  const [errors, setErrors] = useState({});
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);

  const yearOptions = Array.from({ length: 48 }, (_, i) => 2006 - i);
  const places = [
    'Arboga',
    'Stockholm',
    'Gothenburg',
    'Malmö',
    'Uppsala',
    'Västerås',
    'Örebro',
    'Linköping',
    'Helsingborg',
    'Jönköping',
  ];
  const sources = ['TikTok', 'Instagram', 'Facebook', 'Google', 'Friend', 'Other'];
  const agencyContact = {
    name: 'Arbetsförmedlingen',
    email: 'arbetsformedlingen@arbetsformedlingen.se',
    phone: '+46 10 487 10 00',
    website: 'https://www.arbetsformedlingen.se/',
  };

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const onboardingStep = Number(user.onboardingStep) || 0;

    if (onboardingStep >= 3) {
      router.replace('/candidate/dashboard');
    } else if (onboardingStep >= 2) {
      router.replace('/candidate/step2');
    }
  }, [authLoading, router, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts editing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.yearOfBirth) newErrors.yearOfBirth = 'Year of birth is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.placeOfResidence) newErrors.placeOfResidence = 'Place of residence is required';
    if (!formData.registeredWithSEA) newErrors.registeredWithSEA = 'Please answer this question';
    if (!formData.eligibleForRustaOchMatcha) newErrors.eligibleForRustaOchMatcha = 'Please answer this question';
    if (!formData.lookingForJobOrTraining) newErrors.lookingForJobOrTraining = 'Please answer this question';
    if (!formData.wouldYouLikeUsToCall) newErrors.wouldYouLikeUsToCall = 'Please answer this question';
    if (!formData.whereDidYouHearAboutUs) newErrors.whereDidYouHearAboutUs = 'Please select an option';
    if (!formData.consentHelloLilly) newErrors.consentHelloLilly = 'This agreement is required';
    if (!formData.consentPrivacy) newErrors.consentPrivacy = 'Privacy agreement is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Call eligibility check API
      const response = await fetch('/api/candidate/eligibility-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          yearOfBirth: parseInt(formData.yearOfBirth),
          phoneNumber: formData.phoneNumber,
          placeOfResidence: formData.placeOfResidence,
          registeredWithSEA: formData.registeredWithSEA,
          eligibleForRustaOchMatcha: formData.eligibleForRustaOchMatcha === "Don't know" ? 'Dont know' : formData.eligibleForRustaOchMatcha,
          lookingForJobOrTraining: formData.lookingForJobOrTraining,
          wouldYouLikeUsToCall: formData.wouldYouLikeUsToCall,
          whereDidYouHearAboutUs: formData.whereDidYouHearAboutUs,
          consentHelloLilly: formData.consentHelloLilly,
          consentPrivacy: formData.consentPrivacy,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to check eligibility');
        setIsLoading(false);
        return;
      }

      // Check eligibility result
      if (data.data.eligibilityStatus === 'eligible') {
        // Save form data to localStorage for later use
        const candidateProfile = {
          step1: formData,
          completedAt: new Date().toISOString(),
        };
        localStorage.setItem('candidateProfile', JSON.stringify(candidateProfile));

        // Redirect to step 2
        router.push('/candidate/step2');
      } else {
        // Redirect to not-eligible page
        router.push('/candidate/not-eligible');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during eligibility check');
    } finally {
      setIsLoading(false);
    }
  };

  // Short/condensed submit for stepper flow
  const handleShortSubmit = async (e) => {
    e?.preventDefault();

    // minimal validation (more explicit checks to avoid false positives)
    const missing = [];
    if (!formData.phoneNumber || !String(formData.phoneNumber).trim()) missing.push('phone');
    if (!formData.registeredWithSEA) missing.push('registeredWithSEA');
    if (!formData.eligibleForRustaOchMatcha) missing.push('eligibleForRustaOchMatcha');
    if (!formData.lookingForJobOrTraining) missing.push('lookingForJobOrTraining');
    if (!formData.consentHelloLilly) missing.push('consentHelloLilly');
    if (!formData.consentPrivacy) missing.push('consentPrivacy');

    if (missing.length) {
      setError('Please complete required fields: ' + missing.join(', '));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const nameParts = (user?.name || '').trim().split(/\s+/).filter(Boolean);
      const fallbackFirstName = user?.firstName || nameParts[0] || 'Candidate';
      const fallbackLastName = user?.lastName || nameParts.slice(1).join(' ') || 'User';
      const payload = {
        firstName: fallbackFirstName,
        lastName: fallbackLastName,
        yearOfBirth: formData.yearOfBirth || 1990,
        phoneNumber: formData.phoneNumber,
        placeOfResidence: formData.placeOfResidence || 'Unknown',
        registeredWithSEA: formData.registeredWithSEA,
        eligibleForRustaOchMatcha: formData.eligibleForRustaOchMatcha === "Don't know" ? 'Dont know' : formData.eligibleForRustaOchMatcha,
        lookingForJobOrTraining: formData.lookingForJobOrTraining,
        wouldYouLikeUsToCall: formData.wouldYouLikeUsToCall || 'No',
        whereDidYouHearAboutUs: formData.whereDidYouHearAboutUs || 'Other',
        consentHelloLilly: formData.consentHelloLilly,
        consentPrivacy: formData.consentPrivacy,
      };

      const response = await fetch('/api/candidate/eligibility-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to check eligibility');
        setIsLoading(false);
        return;
      }

      if (data.data.eligibilityStatus === 'eligible') {
        const candidateProfile = { step1: payload, completedAt: new Date().toISOString() };
        localStorage.setItem('candidateProfile', JSON.stringify(candidateProfile));
        router.push('/candidate/step2');
      } else {
        router.push('/candidate/not-eligible');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during eligibility check');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4 py-10">
      <div className="w-full max-w-4xl">
        <div className="w-full max-h-[90vh] overflow-y-auto rounded-3xl border border-white/20 bg-white/98 shadow-2xl flex flex-col">
          {/* Intro / Proceed control */}
          {!started ? (
            <div className="space-y-6 p-10 text-center flex flex-col">
              <div className="space-y-3 text-sm text-gray-700">
                <h1 className="text-2xl font-bold text-gray-900">Before you start: Eligibility check</h1>
                <p className="text-gray-600">We will help you check your eligibility with the Swedish Employment Agency. You can contact them first if needed.</p>
                <Card header="Before You Start">
                  <div className="space-y-3 text-left text-sm text-gray-700">
                    <p>
                      If you are unsure about your eligibility, contact the Swedish Employment Agency first.
                      Their details are shown below so you can verify your status before submitting the form.
                    </p>
                    <div className="grid gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Email</p>
                        <a href={`mailto:${agencyContact.email}`} className="font-medium text-blue-900 hover:underline">
                          {agencyContact.email}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Phone</p>
                        <a href={`tel:${agencyContact.phone.replace(/\s/g, '')}`} className="font-medium text-blue-900 hover:underline">
                          {agencyContact.phone}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Website</p>
                        <a href={agencyContact.website} target="_blank" rel="noreferrer" className="font-medium text-blue-900 hover:underline">
                          Visit Arbetsförmedlingen
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              <div className="grid gap-3 md:grid-cols-3 w-full">
                <a href={`mailto:${agencyContact.email}`} className="rounded-md border px-4 py-3 text-sm font-medium text-blue-700 bg-blue-50">Email Agency</a>
                <a href={`mailto:${agencyContact.email}`} className="rounded-md border px-4 py-3 text-sm font-medium text-blue-700 bg-blue-50">Email Agency</a>
                <a href={`tel:${agencyContact.phone.replace(/\s/g, '')}`} className="rounded-md border px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">Call Agency</a>
                <a href={agencyContact.website} target="_blank" rel="noreferrer" className="rounded-md border px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">Visit Website</a>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={() => setShowConfirm(true)} className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 flex items-center gap-2">Proceed if you have confirmed with the agency<span>→</span></button>
              </div>

              {showConfirm && (
                <div className="absolute inset-0 z-60 flex items-center justify-center">
                  <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                    <h3 className="mb-4 text-lg font-semibold">Are you sure?</h3>
                    <p className="mb-6 text-sm text-gray-600">Have you confirmed your status with the agency? Proceeding will start the eligibility check.</p>
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setShowConfirm(false)} className="rounded border px-4 py-2">No</button>
                      <button onClick={() => { setShowConfirm(false); setStarted(true); setStepIndex(1); }} className="rounded bg-blue-600 px-4 py-2 text-white">Yes</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-semibold">{error}</p>
                </div>
              )}

              {stepIndex === 1 ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Step 1: Contact</h1>
                      <p className="text-gray-600 mt-2">Confirm your contact details</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Step 1 of 2</div>
                    </div>
                  </div>

                  <Card header="Contact">
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input value={user?.email || ''} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+46 70 123 4567" className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button onClick={() => { setStepIndex(2); }} type="button" className="ml-auto rounded bg-blue-600 text-white px-4 py-2">Proceed to Questions</button>
                    </div>
                  </Card>
                </div>
              ) : (
                <form onSubmit={handleShortSubmit} className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">Step 2: Quick Questions</h1>
                        <p className="text-gray-600 mt-2">Answer a few short questions to check eligibility</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Step 2 of 2</div>
                      </div>
                    </div>
                  </div>

                  <Card header="Quick Eligibility">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Are you registered with Swedish Employment Agency? *</label>
                        <div className="flex gap-4">
                          {['Yes','No'].map(opt => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="registeredWithSEA" value={opt} checked={formData.registeredWithSEA===opt} onChange={handleChange} /> <span>{opt}</span></label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Are you eligible for Rusta och matcha? *</label>
                        <div className="flex gap-4">
                          {['Yes','No',"Don't know"].map(opt => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="eligibleForRustaOchMatcha" value={opt} checked={formData.eligibleForRustaOchMatcha===opt} onChange={handleChange} /> <span>{opt}</span></label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Are you looking for a job or training? *</label>
                        <div className="flex gap-4">
                          {['Yes','No'].map(opt => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lookingForJobOrTraining" value={opt} checked={formData.lookingForJobOrTraining===opt} onChange={handleChange} /> <span>{opt}</span></label>
                          ))}
                        </div>
                      </div>

                      <label className="flex items-center gap-2"><input type="checkbox" name="consentHelloLilly" checked={formData.consentHelloLilly} onChange={handleChange} /> <span className="text-sm">I consent to HelloLilly being a provider</span></label>
                      <label className="flex items-center gap-2"><input type="checkbox" name="consentPrivacy" checked={formData.consentPrivacy} onChange={handleChange} /> <span className="text-sm">I agree to the Privacy Policy</span></label>
                    </div>
                  </Card>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStepIndex(1)} className="rounded border px-4 py-2">Back</button>
                    <button type="submit" className="ml-auto rounded bg-blue-600 text-white px-4 py-2">Check Eligibility</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
