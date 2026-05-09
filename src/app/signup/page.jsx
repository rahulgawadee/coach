'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState('candidate');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // For coach multi-step form

  const [formData, setFormData] = useState({
    // Shared fields
    email: '',
    password: '',
    confirmPassword: '',
    // Coach fields
    fullName: '',
    phoneNumber: '',
    companyName: '',
    companyRegistrationNumber: '',
    governmentAgencyId: '',
    bio: '',
    expertiseAreas: [],
    yearsOfExperience: '',
    certifications: '',
    contactPersonName: '',
    maxCandidates: '15',
    preferredWorkingHours: {
      startTime: '09:00',
      endTime: '17:00',
    },
    agreeToTermsOfService: false,
    confirmedRegisteredSupplier: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleFromQuery = params.get('role');
    if (roleFromQuery === 'coach') {
      setRole('coach');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleExpertiseToggle = (area) => {
    setFormData((prev) => ({
      ...prev,
      expertiseAreas: prev.expertiseAreas.includes(area)
        ? prev.expertiseAreas.filter((a) => a !== area)
        : [...prev.expertiseAreas, area],
    }));
  };

  const handleTimeChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      preferredWorkingHours: {
        ...prev.preferredWorkingHours,
        [field]: value,
      },
    }));
  };

  const validateCoachStep = (stepNum) => {
    let errors = [];

    if (stepNum === 1) {
      // Account Information
      if (!formData.email.trim()) errors.push('Email is required');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        errors.push('Invalid email format');
      if (!formData.password) errors.push('Password is required');
      else if (formData.password.length < 8)
        errors.push('Password must be at least 8 characters');
      if (formData.password !== formData.confirmPassword)
        errors.push('Passwords do not match');
      if (!formData.fullName.trim()) errors.push('Full name is required');
    } else if (stepNum === 2) {
      // Company Information
      if (!formData.companyName.trim()) errors.push('Company name is required');
      if (!formData.companyRegistrationNumber.trim())
        errors.push('Company registration number is required');
      if (!formData.governmentAgencyId.trim())
        errors.push('Government agency ID is required');
    } else if (stepNum === 3) {
      // Professional Information
      if (!formData.bio.trim()) errors.push('Bio is required');
      if (formData.expertiseAreas.length === 0) errors.push('Select at least one expertise area');
      if (!formData.yearsOfExperience) errors.push('Years of experience is required');
    } else if (stepNum === 4) {
      // Contact Information
      if (!formData.phoneNumber.trim()) errors.push('Phone number is required');
    } else if (stepNum === 5) {
      // Capacity
      const maxCandidates = parseInt(formData.maxCandidates);
      if (maxCandidates < 5 || maxCandidates > 50)
        errors.push('Maximum candidates must be between 5-50');
    } else if (stepNum === 6) {
      // Agreement
      if (!formData.agreeToTermsOfService)
        errors.push('You must agree to terms of service');
      if (!formData.confirmedRegisteredSupplier)
        errors.push('You must confirm you are a registered supplier');
    }

    if (errors.length > 0) {
      setError(errors[0]);
      return false;
    }
    return true;
  };

  const handleCandidateSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(
        formData.email,
        formData.password,
        formData.confirmPassword,
        'Candidate',
        formData.email.split('@')[0]
      );

      if (!result.success) {
        setError(result.error || 'Registration failed');
      } else {
        router.push('/candidate/step1');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoachNext = () => {
    if (validateCoachStep(step)) {
      setStep(step + 1);
      setError('');
    }
  };

  const handleCoachBack = () => {
    setStep(step - 1);
    setError('');
  };

  const handleCoachSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateCoachStep(step)) {
      return;
    }

    setIsLoading(true);

    try {
      // First register the user
      const registerResult = await register(
        formData.email,
        formData.password,
        formData.confirmPassword,
        'Coach',
        formData.fullName
      );

      if (!registerResult.success) {
        setError(registerResult.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Then submit the coach profile
      const response = await fetch('/api/coach/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          companyName: formData.companyName,
          companyRegistrationNumber: formData.companyRegistrationNumber,
          governmentAgencyId: formData.governmentAgencyId,
          bio: formData.bio,
          expertiseAreas: formData.expertiseAreas,
          yearsOfExperience: parseInt(formData.yearsOfExperience),
          certifications: formData.certifications,
          contactPersonName: formData.contactPersonName,
          maxCandidates: parseInt(formData.maxCandidates),
          preferredWorkingHours: formData.preferredWorkingHours,
          agreeToTermsOfService: formData.agreeToTermsOfService,
          confirmedRegisteredSupplier: formData.confirmedRegisteredSupplier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create coach profile');
        setIsLoading(false);
        return;
      }

      // Redirect to coach dashboard
      router.push('/coach/dashboard');
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Coach
          </div>
          <p className="text-gray-600">
            Sign up as {role === 'candidate' ? 'Candidate' : 'Coach/Mentor'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          {/* Role Selection */}
          {role === 'candidate' || step === 0 ? (
            <div className="p-8">
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  I want to join as a:
                </label>
                <div className="space-y-3">
                  <label
                    className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all"
                    style={{
                      borderColor: role === 'candidate' ? '#2563eb' : '#e5e7eb',
                      backgroundColor: role === 'candidate' ? '#eff6ff' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="candidate"
                      checked={role === 'candidate'}
                      onChange={(e) => {
                        setRole(e.target.value);
                        setStep(0);
                      }}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">Candidate</p>
                      <p className="text-xs text-gray-600">
                        Looking for mentorship & career growth
                      </p>
                    </div>
                  </label>

                  <label
                    className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all"
                    style={{
                      borderColor: role === 'coach' ? '#2563eb' : '#e5e7eb',
                      backgroundColor: role === 'coach' ? '#eff6ff' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="coach"
                      checked={role === 'coach'}
                      onChange={(e) => {
                        setRole(e.target.value);
                        setStep(1);
                      }}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">Coach/Mentor</p>
                      <p className="text-xs text-gray-600">
                        Willing to share expertise & guide others
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          ) : null}

          {/* Candidate Form */}
          {role === 'candidate' && (
            <form onSubmit={handleCandidateSubmit} className="p-8 space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />

              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                required
              />

              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 mt-0.5"
                  disabled={isLoading}
                  required
                />
                <span className="text-gray-600">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    Privacy Policy
                  </a>
                </span>
              </label>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="w-full mt-6"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          )}

          {/* Coach Form - Multi-step */}
          {role === 'coach' && (
            <form className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Progress indicator */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Step {step} of 6
                  </span>
                  <span className="text-sm text-gray-500">{Math.round((step / 6) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(step / 6) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Step 1: Account Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Account Information
                  </h3>
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <Input
                    label="Full Name"
                    type="text"
                    name="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              )}

              {/* Step 2: Company Information */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Company Information
                  </h3>
                  <Input
                    label="Company Name"
                    type="text"
                    name="companyName"
                    placeholder="Your Company"
                    value={formData.companyName}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <Input
                    label="Company Registration Number (Swedish Org Number)"
                    type="text"
                    name="companyRegistrationNumber"
                    placeholder="123456-7890"
                    value={formData.companyRegistrationNumber}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <Input
                    label="Government Agency ID (Arbetsförmedlingen Supplier ID)"
                    type="text"
                    name="governmentAgencyId"
                    placeholder="Supplier ID"
                    value={formData.governmentAgencyId}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              )}

              {/* Step 3: Professional Information */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Professional Information
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio / About Me
                    </label>
                    <textarea
                      name="bio"
                      placeholder="Tell us about your experience and expertise..."
                      value={formData.bio}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                      required
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expertise Areas (select all that apply)
                    </label>
                    <div className="space-y-2">
                      {['IT', 'Healthcare', 'Construction', 'Finance', 'Education'].map(
                        (area) => (
                          <label key={area} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.expertiseAreas.includes(area)}
                              onChange={() => handleExpertiseToggle(area)}
                              disabled={isLoading}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-gray-700">{area}</span>
                          </label>
                        )
                      )}
                    </div>
                  </div>

                  <Input
                    label="Years of Experience"
                    type="number"
                    name="yearsOfExperience"
                    placeholder="10"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />

                  <Input
                    label="Certifications (optional)"
                    type="text"
                    name="certifications"
                    placeholder="List your certifications"
                    value={formData.certifications}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Step 4: Contact Information */}
              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Contact Information
                  </h3>
                  <Input
                    label="Phone Number"
                    type="tel"
                    name="phoneNumber"
                    placeholder="+46 123 456 7890"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <Input
                    label="Contact Person Name (if different from coach)"
                    type="text"
                    name="contactPersonName"
                    placeholder="Jane Doe"
                    value={formData.contactPersonName}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Step 5: Capacity */}
              {step === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity</h3>
                  <Input
                    label="Maximum Candidates I can handle (5-50)"
                    type="number"
                    name="maxCandidates"
                    placeholder="15"
                    value={formData.maxCandidates}
                    onChange={handleChange}
                    disabled={isLoading}
                    min="5"
                    max="50"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Working Hours
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-600">Start Time</label>
                        <input
                          type="time"
                          value={formData.preferredWorkingHours.startTime}
                          onChange={(e) => handleTimeChange('startTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">End Time</label>
                        <input
                          type="time"
                          value={formData.preferredWorkingHours.endTime}
                          onChange={(e) => handleTimeChange('endTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Agreements */}
              {step === 6 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Agreements</h3>
                  <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="agreeToTermsOfService"
                      checked={formData.agreeToTermsOfService}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="w-4 h-4 rounded mt-0.5"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to terms of service
                    </span>
                  </label>
                  <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="confirmedRegisteredSupplier"
                      checked={formData.confirmedRegisteredSupplier}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="w-4 h-4 rounded mt-0.5"
                    />
                    <span className="text-sm text-gray-700">
                      I confirm I am a registered supplier with Swedish Employment Agency
                    </span>
                  </label>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCoachBack}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Back
                  </Button>
                )}
                {step < 6 ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCoachNext}
                    disabled={isLoading}
                    className={step === 1 ? 'w-full' : 'flex-1'}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCoachSubmit}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}

