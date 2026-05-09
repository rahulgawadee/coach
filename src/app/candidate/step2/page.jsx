'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { ai, candidate } from '@/services/api';

const educationOptions = [
  'High School',
  'Bachelor Degree',
  'Master Degree',
  'PhD',
  'Trade/Vocational',
  'Other',
];

const industries = ['IT', 'Healthcare', 'Construction', 'Finance', 'Education'];
const jobTypes = ['Full-time', 'Part-time', 'Internship', 'Training'];
const meetingTimes = ['Morning', 'Afternoon', 'Evening'];
const supportOptions = [
  { id: 'cv', label: 'CV help' },
  { id: 'interview', label: 'Interview prep' },
  { id: 'jobsearch', label: 'Job search' },
  { id: 'training', label: 'Training' },
];
const languageOptions = ['Swedish', 'English', 'Arabic', 'Spanish', 'French', 'Other'];

export default function Step2Page() {
  const router = useRouter();
  const { user: authUser, loading: authLoading, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState({
    skills: false,
    strengths: false,
    bio: false,
    occupation: false
  });
  const [error, setError] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [occupationSuggestions, setOccupationSuggestions] = useState([]);

  const [formData, setFormData] = useState({
    currentOccupation: '',
    educationLevel: '',
    yearsExperience: '',
    industryPreferences: [],
    desiredJobType: '',
    availableToStart: '',
    weeklyHoursAvailable: '',
    preferredMeetingTimes: [],
    skills: '',
    topStrengths: '',
    aboutYourself: '',
    supportNeeded: [],
    hasPersonnummer: '',
    hasDriverLicense: '',
    languagesSpoken: [],
  });

  const [errors, setErrors] = useState({});

  const parsedSkills = useMemo(
    () =>
      formData.skills
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [formData.skills]
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      if (name.startsWith('industry_')) {
        const industry = name.replace('industry_', '');
        setFormData((prev) => ({
          ...prev,
          industryPreferences: checked
            ? [...prev.industryPreferences, industry]
            : prev.industryPreferences.filter((item) => item !== industry),
        }));
      } else if (name.startsWith('time_')) {
        const time = name.replace('time_', '');
        setFormData((prev) => ({
          ...prev,
          preferredMeetingTimes: checked
            ? [...prev.preferredMeetingTimes, time]
            : prev.preferredMeetingTimes.filter((item) => item !== time),
        }));
      } else if (name.startsWith('support_')) {
        const support = name.replace('support_', '');
        setFormData((prev) => ({
          ...prev,
          supportNeeded: checked
            ? [...prev.supportNeeded, support]
            : prev.supportNeeded.filter((item) => item !== support),
        }));
      } else if (name.startsWith('language_')) {
        const language = name.replace('language_', '');
        setFormData((prev) => ({
          ...prev,
          languagesSpoken: checked
            ? [...prev.languagesSpoken, language]
            : prev.languagesSpoken.filter((item) => item !== language),
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: checked ? 'Yes' : 'No' }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  useEffect(() => {
    if (authLoading || !authUser) return;

    // Check status for redirects
    if (authUser.status === 'new') {
      router.replace('/candidate/step1');
    } else if (authUser.status === 'profile_complete') {
      router.replace('/candidate/step3');
    } else if (authUser.status === 'pending_acceptance' || authUser.status === 'active') {
      router.replace('/candidate/dashboard');
    } else if (authUser.status === 'not_eligible') {
      router.replace('/candidate/not-eligible');
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/candidate/profile');
        const result = await res.json();
        if (result.success && result.data) {
          const d = result.data;
          setFormData(prev => ({
            ...prev,
            firstName: d.firstName || '',
            lastName: d.lastName || '',
            currentOccupation: d.currentOccupation || '',
            educationLevel: d.educationLevel || '',
            yearsExperience: d.yearsExperience || '',
            industryPreferences: d.industryPreferences || [],
            desiredJobType: d.desiredJobType || '',
            availableToStart: d.availableToStart ? d.availableToStart.split('T')[0] : '',
            weeklyHoursAvailable: d.weeklyHoursAvailable || '',
            preferredMeetingTimes: d.preferredMeetingTimes || [],
            skills: Array.isArray(d.skills) ? d.skills.join(', ') : d.skills || '',
            topStrengths: Array.isArray(d.topStrengths) ? d.topStrengths.join(', ') : d.topStrengths || '',
            aboutYourself: d.aboutYourself || '',
            supportNeeded: d.supportNeeded || [],
            hasPersonnummer: d.hasPersonnummer || 'No',
            hasDriverLicense: d.hasDriverLicense || 'No',
            languagesSpoken: d.languagesSpoken || [],
          }));
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };

    fetchProfile();
  }, [authLoading, authUser, router]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!formData.currentOccupation.trim()) {
        setOccupationSuggestions([]);
        return;
      }

      try {
        const response = await ai.suggestOccupation({
          currentOccupation: formData.currentOccupation,
          industryPreferences: formData.industryPreferences,
        });
        const suggestions = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        setOccupationSuggestions(suggestions.slice(0, 4));
      } catch {
        setOccupationSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [formData.currentOccupation, formData.industryPreferences]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentOccupation.trim()) newErrors.currentOccupation = 'Required';
    if (!formData.educationLevel) newErrors.educationLevel = 'Required';
    if (!formData.yearsExperience) newErrors.yearsExperience = 'Required';
    if (formData.industryPreferences.length === 0) newErrors.industryPreferences = 'Select at least one';
    if (!formData.desiredJobType) newErrors.desiredJobType = 'Required';
    if (!formData.availableToStart) newErrors.availableToStart = 'Required';
    if (!formData.weeklyHoursAvailable) newErrors.weeklyHoursAvailable = 'Required';
    if (formData.preferredMeetingTimes.length === 0) newErrors.preferredMeetingTimes = 'Select at least one';
    if (!formData.skills.trim()) newErrors.skills = 'Required';
    if (!formData.topStrengths.trim()) newErrors.topStrengths = 'Required';
    if (!formData.aboutYourself.trim()) newErrors.aboutYourself = 'Required';
    if (!formData.hasPersonnummer) newErrors.hasPersonnummer = 'Required';
    if (!formData.hasDriverLicense) newErrors.hasDriverLicense = 'Required';
    if (formData.languagesSpoken.length === 0) newErrors.languagesSpoken = 'Select at least one';

    if (Object.keys(newErrors).length > 0) {
      console.log('Validation failed:', newErrors);
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAISuggestStrengths = async () => {
    setAiLoading(prev => ({ ...prev, strengths: true }));
    setAiMessage('');

    try {
      const response = await ai.suggestStrengths({
        occupation: formData.currentOccupation,
        experience: formData.yearsExperience,
      });

      const strengths = Array.isArray(response?.data) ? response.data : response || [];
      if (strengths.length > 0) {
        setFormData((prev) => ({
          ...prev,
          topStrengths: strengths.slice(0, 3).join(', '),
        }));
        setAiMessage('AI suggested your top strengths.');
      }
    } catch {
      setAiMessage('AI suggestion failed. Please enter strengths manually.');
    } finally {
      setAiLoading(prev => ({ ...prev, strengths: false }));
    }
  };

  const handleAIEnhanceBio = async () => {
    setAiLoading(prev => ({ ...prev, bio: true }));
    setAiMessage('');

    try {
      const response = await ai.enhanceBio({
        bio: formData.aboutYourself,
        skills: parsedSkills,
      });

      const bio = response?.data?.bio || response?.bio;
      if (bio) {
        setFormData((prev) => ({ ...prev, aboutYourself: bio }));
        setAiMessage('AI enhanced your profile summary.');
      }
    } catch {
      setAiMessage('AI enhancement failed. Please edit manually.');
    } finally {
      setAiLoading(prev => ({ ...prev, bio: false }));
    }
  };

  const handleContinue = async () => {
    console.log('Form submission started');
    if (!validateForm()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        yearsExperience: parseInt(formData.yearsExperience, 10) || 0,
        weeklyHoursAvailable: parseInt(formData.weeklyHoursAvailable, 10) || 0,
        skills: parsedSkills,
        topStrengths: formData.topStrengths.split(',').map(s => s.trim()).filter(Boolean),
        aiSuggestions: {
          occupationSuggestions,
        },
      };

      console.log('Submitting payload:', payload);

      const response = await fetch('/api/candidate/step2-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      console.log('Submission result:', result);
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save profile');
      }

      // Update global user status
      updateUser({ status: 'profile_complete', onboardingStep: 3 });
      
      router.push('/candidate/step3');
    } catch (err) {
      setError(err.message || 'Error saving profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Step 2: Detailed Profile</h1>
              <p className="text-gray-600 mt-2">AI-assisted profile completion for coach matching</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Step 2 of 3</div>
              <div className="w-32 h-2 bg-gray-200 rounded-full mt-2">
                <div className="w-2/3 h-full bg-blue-600 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {aiMessage && (
          <div className="mb-6 p-4 bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-5 items-center rounded-full bg-blue-600 px-2 text-[10px] font-bold text-white uppercase tracking-wider">
                ✨ AI Suggestion
              </span>
            </div>
            <p className="text-blue-800 text-sm font-medium">{aiMessage}</p>
          </div>
        )}

        <div className="space-y-6">
          <Card header="Professional Background">
            <div className="space-y-4">
              <Input
                label="Current Occupation"
                name="currentOccupation"
                value={formData.currentOccupation}
                onChange={handleChange}
                error={errors.currentOccupation}
                placeholder="e.g., Software Developer"
                required
              />
              {occupationSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {occupationSuggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, currentOccupation: item }))}
                      className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700 hover:bg-blue-100"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Highest Education Level *</label>
                  <select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none ${errors.educationLevel ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select education level...</option>
                    {educationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.educationLevel && <p className="text-sm text-red-600 mt-1">{errors.educationLevel}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Years of Work Experience *</label>
                  <select
                    name="yearsExperience"
                    value={formData.yearsExperience}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none ${errors.yearsExperience ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select experience...</option>
                    <option value="0-2">0-2 years</option>
                    <option value="2-5">2-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                  {errors.yearsExperience && <p className="text-sm text-red-600 mt-1">{errors.yearsExperience}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Industry Preferences *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {industries.map((industry) => (
                    <label key={industry} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={`industry_${industry}`}
                        checked={formData.industryPreferences.includes(industry)}
                        onChange={handleChange}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-gray-700">{industry}</span>
                    </label>
                  ))}
                </div>
                {errors.industryPreferences && <p className="text-sm text-red-600 mt-1">{errors.industryPreferences}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Desired Job Type *</label>
                <select
                  name="desiredJobType"
                  value={formData.desiredJobType}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none ${errors.desiredJobType ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select job type...</option>
                  {jobTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.desiredJobType && <p className="text-sm text-red-600 mt-1">{errors.desiredJobType}</p>}
              </div>
            </div>
          </Card>

          <Card header="Availability">
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Available to Start"
                  type="date"
                  name="availableToStart"
                  value={formData.availableToStart}
                  onChange={handleChange}
                  error={errors.availableToStart}
                  required
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Weekly Hours Available *</label>
                  <select
                    name="weeklyHoursAvailable"
                    value={formData.weeklyHoursAvailable}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none ${errors.weeklyHoursAvailable ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select hours...</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="40">40</option>
                  </select>
                  {errors.weeklyHoursAvailable && <p className="text-sm text-red-600 mt-1">{errors.weeklyHoursAvailable}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Preferred Meeting Times *</label>
                <div className="space-y-2">
                  {meetingTimes.map((time) => (
                    <label key={time} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={`time_${time}`}
                        checked={formData.preferredMeetingTimes.includes(time)}
                        onChange={handleChange}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-gray-700">{time}</span>
                    </label>
                  ))}
                </div>
                {errors.preferredMeetingTimes && <p className="text-sm text-red-600 mt-1">{errors.preferredMeetingTimes}</p>}
              </div>
            </div>
          </Card>

          <Card header="Skills & Goals">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Your Skills *</label>
                </div>
                <Input
                  label=""
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  error={errors.skills}
                  placeholder="JavaScript, Excel, Project Management"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">What are your top 3 strengths? *</label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAISuggestStrengths} disabled={aiLoading.strengths}>
                    {aiLoading.strengths ? 'AI...' : 'AI Suggest Strengths'}
                  </Button>
                </div>
                <Input
                  label=""
                  name="topStrengths"
                  value={formData.topStrengths}
                  onChange={handleChange}
                  error={errors.topStrengths}
                  placeholder="Communication, reliability, teamwork"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Tell us about yourself *</label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAIEnhanceBio} disabled={aiLoading.bio}>
                    {aiLoading.bio ? 'AI...' : 'AI Enhance Bio'}
                  </Button>
                </div>
                <textarea
                  name="aboutYourself"
                  value={formData.aboutYourself}
                  onChange={handleChange}
                  placeholder="Share your background, goals, and what you're looking for..."
                  className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none resize-none ${errors.aboutYourself ? 'border-red-500' : 'border-gray-300'}`}
                  rows={5}
                />
                {errors.aboutYourself && <p className="text-sm text-red-600 mt-1">{errors.aboutYourself}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">What support do you need?</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {supportOptions.map((option) => (
                    <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={`support_${option.id}`}
                        checked={formData.supportNeeded.includes(option.id)}
                        onChange={handleChange}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-gray-700 text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card header="Additional Information">
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Do you have a valid Swedish personnummer? *</label>
                  <div className="flex gap-4">
                    {['Yes', 'No'].map((option) => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="hasPersonnummer" value={option} checked={formData.hasPersonnummer === option} onChange={handleChange} />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.hasPersonnummer && <p className="text-sm text-red-600 mt-1">{errors.hasPersonnummer}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Do you have a driver's license? *</label>
                  <div className="flex gap-4">
                    {['Yes', 'No'].map((option) => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="hasDriverLicense" value={option} checked={formData.hasDriverLicense === option} onChange={handleChange} />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.hasDriverLicense && <p className="text-sm text-red-600 mt-1">{errors.hasDriverLicense}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Languages spoken *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {languageOptions.map((language) => (
                    <label key={language} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={`language_${language}`}
                        checked={formData.languagesSpoken.includes(language)}
                        onChange={handleChange}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-gray-700">{language}</span>
                    </label>
                  ))}
                </div>
                {errors.languagesSpoken && <p className="text-sm text-red-600 mt-1">{errors.languagesSpoken}</p>}
              </div>
            </div>
          </Card>

          <div className="flex gap-4 pt-6">
            <Button type="button" variant="outline" size="lg" onClick={() => router.back()} disabled={isLoading}>
              Back
            </Button>
            <Button type="button" variant="primary" size="lg" onClick={handleContinue} disabled={isLoading} className="flex-1">
              {isLoading ? 'Saving Profile...' : 'Save & Continue →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
