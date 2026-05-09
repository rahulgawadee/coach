'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
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
  const [isLoading, setIsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAISuggestSkills = async () => {
    setAiLoading(true);
    setAiMessage('');

    try {
      const response = await ai.suggestSkills({
        currentOccupation: formData.currentOccupation,
        industryPreferences: formData.industryPreferences,
      });

      const items = Array.isArray(response?.data) ? response.data : response || [];
      const skills = items.map((item) => (typeof item === 'string' ? item : item.skill)).filter(Boolean);
      if (skills.length > 0) {
        setFormData((prev) => ({ ...prev, skills: skills.join(', ') }));
        setAiMessage('AI suggested relevant skills for your profile.');
      }
    } catch {
      setAiMessage('AI suggestion failed. Please enter skills manually.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAISuggestStrengths = async () => {
    setAiLoading(true);
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
      setAiLoading(false);
    }
  };

  const handleAIEnhanceBio = async () => {
    setAiLoading(true);
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
      setAiLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!validateForm()) {
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
        aiSuggestions: {
          occupationSuggestions,
        },
      };

      const response = await candidate.submitDetailedForm(payload);
      if (!response.success) {
        throw new Error(response.error || 'Failed to save profile');
      }

      const candidateProfile = JSON.parse(localStorage.getItem('candidateProfile') || '{}');
      candidateProfile.step2 = payload;
      candidateProfile.profileSaved = true;
      localStorage.setItem('candidateProfile', JSON.stringify(candidateProfile));

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.onboardingStep = 3;
      localStorage.setItem('user', JSON.stringify(user));

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
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">{aiMessage}</p>
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
                  <Button type="button" variant="outline" size="sm" onClick={handleAISuggestSkills} disabled={aiLoading}>
                    {aiLoading ? 'AI...' : 'AI Suggest Skills'}
                  </Button>
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
                  <Button type="button" variant="outline" size="sm" onClick={handleAISuggestStrengths} disabled={aiLoading}>
                    {aiLoading ? 'AI...' : 'AI Suggest Strengths'}
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
                  <Button type="button" variant="outline" size="sm" onClick={handleAIEnhanceBio} disabled={aiLoading}>
                    {aiLoading ? 'AI...' : 'AI Enhance Bio'}
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
            <Button type="button" variant="outline" size="lg" onClick={() => router.back()} disabled={isLoading || aiLoading}>
              Back
            </Button>
            <Button type="button" variant="primary" size="lg" onClick={handleContinue} disabled={isLoading || aiLoading} className="flex-1">
              {isLoading ? 'Saving Profile...' : 'Save & Continue →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
