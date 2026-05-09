'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';

export default function CoachProfilePage() {
  const router = useRouter();
  const { isAuthenticated, hasRole } = useAuth();
  const [authToken] = useLocalStorage('token', '');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState({});
  const [activeTab, setActiveTab] = useState('professional');

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Coach')) {
      router.push('/coach/dashboard');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/coach/profile/complete', {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) throw new Error('Failed to load');
        const data = await response.json();
        setProfileData(data.data);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, hasRole, authToken, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChanges({ ...changes, [name]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/coach/profile/complete', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      if (!response.ok) throw new Error('Failed to save');
      alert('Profile updated!');
      setChanges({});
      setProfileData({ ...profileData, ...changes });
    } catch (err) {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!profileData) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Coach Profile</h1>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['personal', 'professional', 'availability', 'statistics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Personal */}
        {activeTab === 'personal' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
            <h2 className="text-xl font-bold">Personal Information</h2>
            <div><label className="block text-sm font-medium mb-1">Full Name</label><input disabled value={profileData.fullName} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" /></div>
            <div><label className="block text-sm font-medium mb-1">Email</label><input disabled value={profileData.email} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" /></div>
            <div><label className="block text-sm font-medium mb-1">Phone</label><input name="phone" defaultValue={profileData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>
        )}

        {/* Professional */}
        {activeTab === 'professional' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
            <h2 className="text-xl font-bold">Professional Information</h2>
            <div><label className="block text-sm font-medium mb-1">Bio</label><textarea name="bio" defaultValue={profileData.bio} onChange={handleInputChange} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium mb-1">Years of Experience</label><input type="number" name="yearsExperience" defaultValue={profileData.yearsExperience} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium mb-1">Certifications (comma-separated)</label><input name="certifications" defaultValue={(profileData.certifications || []).join(', ')} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>
        )}

        {/* Availability */}
        {activeTab === 'availability' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
            <h2 className="text-xl font-bold">Availability & Capacity</h2>
            <div><label className="block text-sm font-medium mb-1">Max Capacity</label><input type="number" name="maxCapacity" defaultValue={profileData.maxCapacity} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div className="p-3 bg-gray-50 rounded"><p className="font-medium text-sm">Current Assignments: {profileData.currentAssignments} / {profileData.maxCapacity}</p></div>
          </div>
        )}

        {/* Statistics */}
        {activeTab === 'statistics' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Statistics</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded"><p className="text-sm text-gray-600">Average Rating</p><p className="text-2xl font-bold text-blue-600">{profileData.averageRating.toFixed(1)} ⭐</p></div>
              <div className="p-4 bg-green-50 rounded"><p className="text-sm text-gray-600">Success Rate</p><p className="text-2xl font-bold text-green-600">{profileData.successRate}%</p></div>
              <div className="p-4 bg-purple-50 rounded"><p className="text-sm text-gray-600">Total Coached</p><p className="text-2xl font-bold text-purple-600">{profileData.totalCandidatesCoached}</p></div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={Object.keys(changes).length === 0 || saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={() => setChanges({})} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg">Discard</button>
        </div>
      </div>
    </div>
  );
}
