'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';

export default function CandidateProfilePage() {
  const router = useRouter();
  const { isAuthenticated, hasRole } = useAuth();
  const [authToken] = useLocalStorage('token', '');

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [changes, setChanges] = useState({});

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Candidate')) {
      router.push('/candidate/dashboard');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/candidate/profile/complete', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Failed to load profile');

        const data = await response.json();
        setProfileData(data.data);
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, hasRole, authToken, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setChanges({ ...changes, [name]: newValue });
  };

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) return;

    setSaving(true);
    try {
      const response = await fetch('/api/candidate/profile/complete', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changes),
      });

      if (!response.ok) throw new Error('Failed to save');

      alert('Profile updated successfully!');
      setChanges({});
      setProfileData({ ...profileData, ...changes });
    } catch (err) {
      setError('Failed to save profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading profile...</div>;
  if (!profileData) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600 mb-6">Profile Completeness: {profileData.completeness}%</p>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

        {/* Section Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'personal', label: 'Personal' },
            { id: 'program', label: 'Program' },
            { id: 'professional', label: 'Professional' },
            { id: 'bio', label: 'Bio' },
            { id: 'goals', label: 'Goals' },
            { id: 'eligibility', label: 'Eligibility' },
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Personal Information */}
        {activeSection === 'personal' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    defaultValue={profileData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    defaultValue={profileData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (read-only)</label>
                <input type="email" value={profileData.email} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={profileData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Program Information */}
        {activeSection === 'program' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Program Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="text" value={profileData.startDate} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Finish Date</label>
                <input
                  type="date"
                  name="finishDate"
                  defaultValue={profileData.finishDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coach Name</label>
                <input type="text" value={profileData.coachName} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" value={profileData.companyName} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
              </div>
            </div>
          </div>
        )}

        {/* Professional Information */}
        {activeSection === 'professional' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Professional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                <input
                  type="text"
                  name="occupation"
                  defaultValue={profileData.occupation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                <select
                  name="educationLevel"
                  defaultValue={profileData.educationLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select...</option>
                  <option value="High School">High School</option>
                  <option value="Bachelor's">Bachelor's Degree</option>
                  <option value="Master's">Master's Degree</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <input
                  type="number"
                  name="yearsExperience"
                  defaultValue={profileData.yearsExperience}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                <select
                  name="employmentStatus"
                  defaultValue={profileData.employmentStatus}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Employed">Employed</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Student">Student</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bio */}
        {activeSection === 'bio' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About Me</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio (max 500 characters)</label>
                <textarea
                  name="bio"
                  defaultValue={profileData.bio}
                  onChange={handleInputChange}
                  maxLength="500"
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{(changes.bio || profileData.bio || '').length}/500</p>
              </div>
            </div>
          </div>
        )}

        {/* Goals */}
        {activeSection === 'goals' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Goals & Support</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short-term Goal</label>
                <input
                  type="text"
                  name="shortTermGoal"
                  defaultValue={profileData.shortTermGoal}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Long-term Goal</label>
                <input
                  type="text"
                  name="longTermGoal"
                  defaultValue={profileData.longTermGoal}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Eligibility */}
        {activeSection === 'eligibility' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Eligibility & Consents</h2>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded text-sm">
                <p className="font-medium">Registered with Agency: {profileData.registeredWithAgency ? 'Yes' : 'No'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded text-sm">
                <p className="font-medium">Eligible for Program: {profileData.eligibleForRustaMatcha ? 'Yes' : 'No'}</p>
              </div>
              <label className="flex items-center p-3 bg-gray-50 rounded cursor-pointer">
                <input type="checkbox" name="marketingConsent" defaultChecked={profileData.marketingConsent} onChange={handleInputChange} />
                <span className="ml-2 text-sm">Marketing Consent</span>
              </label>
              <label className="flex items-center p-3 bg-gray-50 rounded cursor-pointer">
                <input type="checkbox" name="dataProcessingConsent" defaultChecked={profileData.dataProcessingConsent} onChange={handleInputChange} />
                <span className="ml-2 text-sm">Data Processing Consent</span>
              </label>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={Object.keys(changes).length === 0 || saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={() => setChanges({})} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg transition">
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
