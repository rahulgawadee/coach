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

  if (authLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="max-h-[90vh] overflow-y-auto custom-scrollbar">
          {!started ? (
            <div className="p-8 md:p-12 text-center space-y-6">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Eligibility Check</h1>
              <p className="text-lg text-gray-600 max-w-xl mx-auto">
                Before we begin, we need to verify your eligibility for the Rusta och matcha program with the Swedish Employment Agency.
              </p>
              
              {/* Contact Help Section */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 text-left mt-8">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Please call or email to check eligibility</h3>
                <p className="text-sm text-gray-600 mb-4">If you have questions about your eligibility or the program, feel free to reach out to our team directly.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="mailto:info@swedenagency.se" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    info@swedenagency.se
                  </a>
                  <a href="tel:+46081234567" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    +46 08 123 45 67
                  </a>
                </div>
              </div>

              <div className="pt-8">
                <Button onClick={() => setStarted(true)} size="lg" className="w-full sm:w-auto px-12 py-4 text-lg">
                  Start Eligibility Check
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                <button type="button" onClick={() => setStarted(false)} className="text-sm text-blue-600 hover:underline">Go back</button>
              </div>
              
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} error={errors.firstName} required />
                  <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} error={errors.lastName} required />
                  <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} error={errors.email} required />
                  <Input label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} error={errors.phoneNumber} required />
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Year of Birth *</label>
                    <select name="yearOfBirth" value={formData.yearOfBirth} onChange={handleChange} className="w-full px-4 py-2.5 border-2 rounded-lg border-gray-200 focus:border-blue-500 focus:outline-none transition-all">
                      <option value="">Select Year</option>
                      {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {errors.yearOfBirth && <p className="text-xs text-red-500 mt-1">{errors.yearOfBirth}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Place of Residence *</label>
                    <select name="placeOfResidence" value={formData.placeOfResidence} onChange={handleChange} className="w-full px-4 py-2.5 border-2 rounded-lg border-gray-200 focus:border-blue-500 focus:outline-none transition-all">
                      <option value="">Select City</option>
                      {places.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {errors.placeOfResidence && <p className="text-xs text-red-500 mt-1">{errors.placeOfResidence}</p>}
                  </div>
                </div>

                <div className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="font-bold text-gray-900">Eligibility Questions</h3>
                  {[
                    { label: 'Are you registered with Swedish Employment Agency?', name: 'registeredWithSEA', options: ['Yes', 'No'] },
                    { label: 'Are you eligible for Rusta och matcha?', name: 'eligibleForRustaOchMatcha', options: ['Yes', 'No', "Don't know"] },
                    { label: 'Are you looking for a job or training?', name: 'lookingForJobOrTraining', options: ['Yes', 'No'] },
                    { label: 'Would you like us to call you?', name: 'wouldYouLikeUsToCall', options: ['Yes', 'No'] },
                  ].map((q) => (
                    <div key={q.name}>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">{q.label} *</label>
                      <div className="flex flex-wrap gap-6">
                        {q.options.map(opt => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                            <input type="radio" name={q.name} value={opt} checked={formData[q.name] === opt} onChange={handleChange} className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500" />
                            <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">{opt}</span>
                          </label>
                        ))}
                      </div>
                      {errors[q.name] && <p className="text-xs text-red-500 mt-1">{errors[q.name]}</p>}
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Where did you hear about us? *</label>
                    <select name="whereDidYouHearAboutUs" value={formData.whereDidYouHearAboutUs} onChange={handleChange} className="w-full px-4 py-2.5 border-2 rounded-lg border-gray-200 focus:border-blue-500 focus:outline-none transition-all">
                      <option value="">Select Source</option>
                      {sources.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.whereDidYouHearAboutUs && <p className="text-xs text-red-500 mt-1">{errors.whereDidYouHearAboutUs}</p>}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" name="consentHelloLilly" checked={formData.consentHelloLilly} onChange={handleChange} className="mt-1.5 w-5 h-5 rounded text-blue-600" />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">I consent for being my provider for the Rusta och matcha program.</span>
                  </label>
                  {errors.consentHelloLilly && <p className="text-xs text-red-500 mt-1">{errors.consentHelloLilly}</p>}

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" name="consentPrivacy" checked={formData.consentPrivacy} onChange={handleChange} className="mt-1.5 w-5 h-5 rounded text-blue-600" />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">I agree to the Privacy Policy and processing of my personal data.</span>
                  </label>
                  {errors.consentPrivacy && <p className="text-xs text-red-500 mt-1">{errors.consentPrivacy}</p>}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" size="lg" disabled={isLoading} className="w-full py-4 text-lg">
                  {isLoading ? 'Checking Eligibility...' : 'Submit Eligibility Check →'}
                </Button>
              </div>
              
              <div className="pt-6 text-center border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Having trouble? Contact us at <a href="mailto:info@swedenagency.se" className="text-blue-600 hover:underline">info@swedenagency.se</a>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
      
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
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
