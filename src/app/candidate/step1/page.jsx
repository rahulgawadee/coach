'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

export default function Step1Page() {
  const router = useRouter();
  const { user, loading: authLoading, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
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

  const yearOptions = Array.from({ length: 2006 - 1959 + 1 }, (_, i) => 2006 - i);
  const places = [
    'Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 
    'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping'
  ];
  const sources = ['TikTok', 'Instagram', 'Facebook', 'Google', 'Friend', 'Other'];

  useEffect(() => {
    if (authLoading || !user) return;
    
    // Sync initial data from user object if available
    setFormData(prev => ({
      ...prev,
      firstName: user.firstName || user.name?.split(' ')[0] || '',
      lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email || '',
    }));

    // Redirect if already passed this step based on backend status
    if (user.status === 'eligible') {
      router.replace('/candidate/step2');
    } else if (user.status === 'profile_complete') {
      router.replace('/candidate/step3');
    } else if (user.status === 'pending_acceptance' || user.status === 'active') {
      router.replace('/candidate/dashboard');
    } else if (user.status === 'not_eligible') {
      router.replace('/candidate/not-eligible');
    }
  }, [authLoading, user, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.yearOfBirth) newErrors.yearOfBirth = 'Required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Required';
    if (!formData.placeOfResidence) newErrors.placeOfResidence = 'Required';
    if (!formData.registeredWithSEA) newErrors.registeredWithSEA = 'Required';
    if (!formData.eligibleForRustaOchMatcha) newErrors.eligibleForRustaOchMatcha = 'Required';
    if (!formData.lookingForJobOrTraining) newErrors.lookingForJobOrTraining = 'Required';
    if (!formData.wouldYouLikeUsToCall) newErrors.wouldYouLikeUsToCall = 'Required';
    if (!formData.whereDidYouHearAboutUs) newErrors.whereDidYouHearAboutUs = 'Required';
    if (!formData.consentHelloLilly) newErrors.consentHelloLilly = 'Required';
    if (!formData.consentPrivacy) newErrors.consentPrivacy = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/candidate/eligibility-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check eligibility');
      }

      // Update local user state with new status from backend
      if (result.data.eligibilityStatus === 'eligible') {
        updateUser({ status: 'eligible', onboardingStep: 2 });
        router.push('/candidate/step2');
      } else {
        updateUser({ status: 'not_eligible', onboardingStep: -1 });
        router.push('/candidate/not-eligible');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-3xl">
        {!started ? (
          <div className="text-center space-y-6 py-12">
            <h1 className="text-4xl font-bold text-gray-900">Eligibility Check</h1>
            <p className="text-xl text-gray-600 max-w-xl mx-auto">
              Before we begin, we need to verify your eligibility for the Rusta och matcha program with the Swedish Employment Agency.
            </p>
            <div className="pt-6">
              <Button onClick={() => setStarted(true)} size="lg" className="px-12">
                Start Eligibility Check
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card header="Personal Information">
              <div className="grid md:grid-cols-2 gap-6">
                <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} error={errors.firstName} required />
                <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} error={errors.lastName} required />
                <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} error={errors.email} required />
                <Input label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} error={errors.phoneNumber} required />
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Year of Birth *</label>
                  <select name="yearOfBirth" value={formData.yearOfBirth} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                    <option value="">Select Year</option>
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  {errors.yearOfBirth && <p className="text-xs text-red-500 mt-1">{errors.yearOfBirth}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Place of Residence *</label>
                  <select name="placeOfResidence" value={formData.placeOfResidence} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                    <option value="">Select City</option>
                    {places.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.placeOfResidence && <p className="text-xs text-red-500 mt-1">{errors.placeOfResidence}</p>}
                </div>
              </div>
            </Card>

            <Card header="Eligibility Questions">
              <div className="space-y-6">
                {[
                  { label: 'Are you registered with Swedish Employment Agency?', name: 'registeredWithSEA', options: ['Yes', 'No'] },
                  { label: 'Are you eligible for Rusta och matcha?', name: 'eligibleForRustaOchMatcha', options: ['Yes', 'No', "Don't know"] },
                  { label: 'Are you looking for a job or training?', name: 'lookingForJobOrTraining', options: ['Yes', 'No'] },
                  { label: 'Would you like us to call you?', name: 'wouldYouLikeUsToCall', options: ['Yes', 'No'] },
                ].map((q) => (
                  <div key={q.name}>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">{q.label} *</label>
                    <div className="flex gap-6">
                      {q.options.map(opt => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name={q.name} value={opt} checked={formData[q.name] === opt} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                    {errors[q.name] && <p className="text-xs text-red-500 mt-1">{errors[q.name]}</p>}
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Where did you hear about us? *</label>
                  <select name="whereDidYouHearAboutUs" value={formData.whereDidYouHearAboutUs} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                    <option value="">Select Source</option>
                    {sources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.whereDidYouHearAboutUs && <p className="text-xs text-red-500 mt-1">{errors.whereDidYouHearAboutUs}</p>}
                </div>
              </div>
            </Card>

            <Card header="Consents">
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" name="consentHelloLilly" checked={formData.consentHelloLilly} onChange={handleChange} className="mt-1" />
                  <span className="text-sm text-gray-600">I consent to HelloLilly being my provider for the Rusta och matcha program.</span>
                </label>
                {errors.consentHelloLilly && <p className="text-xs text-red-500 mt-1">{errors.consentHelloLilly}</p>}

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" name="consentPrivacy" checked={formData.consentPrivacy} onChange={handleChange} className="mt-1" />
                  <span className="text-sm text-gray-600">I agree to the Privacy Policy and processing of my personal data.</span>
                </label>
                {errors.consentPrivacy && <p className="text-xs text-red-500 mt-1">{errors.consentPrivacy}</p>}
              </div>
            </Card>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isLoading} className="px-12">
                {isLoading ? 'Checking Eligibility...' : 'Submit Eligibility Check'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
