'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

export default function Step1Page() {
  const router = useRouter();
  const { user } = useAuth();
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Step 1: Eligibility Check</h1>
              <p className="text-gray-600 mt-2">Swedish Employment Agency Form</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Step 1 of 3</div>
              <div className="w-32 h-2 bg-gray-200 rounded-full mt-2">
                <div className="w-1/3 h-full bg-blue-600 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <Card header="Personal Information">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                placeholder="John"
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                placeholder="Doe"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year of Birth *
                </label>
                <select
                  name="yearOfBirth"
                  value={formData.yearOfBirth}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.yearOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select year...</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.yearOfBirth && (
                  <p className="text-sm text-red-600 mt-1">{errors.yearOfBirth}</p>
                )}
              </div>

              <Input
                label="Phone Number"
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={errors.phoneNumber}
                placeholder="+46 70 123 4567"
                required
              />
            </div>

            <div className="mt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Place of Residence *
                </label>
                <select
                  name="placeOfResidence"
                  value={formData.placeOfResidence}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.placeOfResidence ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select city...</option>
                  {places.map((place) => (
                    <option key={place} value={place}>
                      {place}
                    </option>
                  ))}
                </select>
                {errors.placeOfResidence && (
                  <p className="text-sm text-red-600 mt-1">{errors.placeOfResidence}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Employment Agency Section */}
          <Card header="Employment Agency Questions">
            <div className="space-y-4">
              {/* Question 1 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Are you registered with Swedish Employment Agency? *
                </label>
                <div className="flex gap-4">
                  {['Yes', 'No'].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="registeredWithSEA"
                        value={option}
                        checked={formData.registeredWithSEA === option}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
                {errors.registeredWithSEA && (
                  <p className="text-sm text-red-600 mt-1">{errors.registeredWithSEA}</p>
                )}
              </div>

              {/* Question 2 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Are you eligible for Rusta och matcha? *
                </label>
                <div className="flex gap-4">
                  {['Yes', 'No', "Don't know"].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="eligibleForRustaOchMatcha"
                        value={option}
                        checked={formData.eligibleForRustaOchMatcha === option}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
                {errors.eligibleForRustaOchMatcha && (
                  <p className="text-sm text-red-600 mt-1">{errors.eligibleForRustaOchMatcha}</p>
                )}
              </div>

              {/* Question 3 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Are you looking for a job or training? *
                </label>
                <div className="flex gap-4">
                  {['Yes', 'No'].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="lookingForJobOrTraining"
                        value={option}
                        checked={formData.lookingForJobOrTraining === option}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
                {errors.lookingForJobOrTraining && (
                  <p className="text-sm text-red-600 mt-1">{errors.lookingForJobOrTraining}</p>
                )}
              </div>

              {/* Question 4 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Would you like us to call you? *
                </label>
                <div className="flex gap-4">
                  {['Yes', 'No'].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="wouldYouLikeUsToCall"
                        value={option}
                        checked={formData.wouldYouLikeUsToCall === option}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
                {errors.wouldYouLikeUsToCall && (
                  <p className="text-sm text-red-600 mt-1">{errors.wouldYouLikeUsToCall}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Additional Information */}
          <Card header="Additional Information">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Where did you hear about us? *
              </label>
              <select
                name="whereDidYouHearAboutUs"
                value={formData.whereDidYouHearAboutUs}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-all ${
                  errors.whereDidYouHearAboutUs ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select source...</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
              {errors.whereDidYouHearAboutUs && (
                <p className="text-sm text-red-600 mt-1">{errors.whereDidYouHearAboutUs}</p>
              )}
            </div>
          </Card>

          {/* Consents */}
          <Card header="Agreements">
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <input
                  type="checkbox"
                  name="consentHelloLilly"
                  checked={formData.consentHelloLilly}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5 rounded"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    I consent to HelloLilly being a provider
                  </p>
                  <p className="text-sm text-gray-600">
                    HelloLilly will help facilitate your mentorship experience
                  </p>
                </div>
              </label>
              {errors.consentHelloLilly && (
                <p className="text-sm text-red-600">{errors.consentHelloLilly}</p>
              )}

              <label className="flex items-start gap-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <input
                  type="checkbox"
                  name="consentPrivacy"
                  checked={formData.consentPrivacy}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5 rounded"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    I agree to the Privacy Policy
                  </p>
                  <p className="text-sm text-gray-600">
                    I have read and accept our privacy terms and conditions
                  </p>
                </div>
              </label>
              {errors.consentPrivacy && (
                <p className="text-sm text-red-600">{errors.consentPrivacy}</p>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Checking eligibility...' : 'Check Eligibility →'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
