'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';

export default function CoachProfilePage() {
  const router = useRouter();
  const { isAuthenticated, hasRole, user } = useAuth();
  const [authToken] = useLocalStorage('token', '');
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    expertise: [],
    yearsOfExperience: 0,
    certifications: '',
    preferredWorkingHours: '',
    maxCandidateCapacity: 15,
    currentAssignment: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const expertiseOptions = [
    'Career Coaching',
    'Interview Preparation',
    'CV Writing',
    'Job Search Strategy',
    'Professional Development',
    'Leadership Skills',
    'Communication Skills',
  ];

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Coach')) {
      router.push('/coach/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/coach/profile', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/coach/login');
            return;
          }
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setProfile(data.profile);
        } else {
          setError(data.error || 'Failed to load profile');
        }
      } catch (err) {
        console.error('Profile error:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, hasRole, authToken, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleExpertiseToggle = (expertise) => {
    setProfile({
      ...profile,
      expertise: profile.expertise.includes(expertise)
        ? profile.expertise.filter((e) => e !== expertise)
        : [...profile.expertise, expertise],
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/coach/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const data = await response.json();
      if (data.success) {
        setSuccess('Profile updated successfully!');
      } else {
        setError(data.error || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPicture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPicture(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'picture');

    try {
      const response = await fetch('/api/coach/profile/upload', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload picture');
      }

      setSuccess('Picture uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleUploadVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'video');

    try {
      const response = await fetch('/api/coach/profile/upload', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload video');
      }

      setSuccess('Video uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Professional Information</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="Tell about yourself and your experience..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Expertise Areas</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {expertiseOptions.map((expertise) => (
                  <label key={expertise} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.expertise.includes(expertise)}
                      onChange={() => handleExpertiseToggle(expertise)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-gray-700">{expertise}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={profile.yearsOfExperience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                <input
                  type="text"
                  name="certifications"
                  value={profile.certifications}
                  onChange={handleInputChange}
                  placeholder="e.g., ICF Coach, PCC"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Availability</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Working Hours</label>
                <input
                  type="text"
                  name="preferredWorkingHours"
                  value={profile.preferredWorkingHours}
                  onChange={handleInputChange}
                  placeholder="e.g., 9 AM - 5 PM"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Candidate Capacity</label>
                <input
                  type="number"
                  name="maxCandidateCapacity"
                  value={profile.maxCandidateCapacity}
                  onChange={handleInputChange}
                  min="1"
                  max="15"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Assignment</label>
                <div className="flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                  <span className="text-gray-700 font-semibold">{profile.currentAssignment}</span>
                  <span className="text-gray-500 ml-2">/ {profile.maxCandidateCapacity}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Media</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <span className="text-3xl mb-2">📸</span>
                  <span className="text-sm text-gray-600">
                    {uploadingPicture ? 'Uploading...' : 'Click to upload or drag & drop'}
                  </span>
                  <input
                    type="file"
                    onChange={handleUploadPicture}
                    disabled={uploadingPicture}
                    className="hidden"
                    accept="image/*"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video Introduction</label>
                <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <span className="text-3xl mb-2">🎥</span>
                  <span className="text-sm text-gray-600">
                    {uploadingVideo ? 'Uploading...' : 'Click to upload or drag & drop'}
                  </span>
                  <input
                    type="file"
                    onChange={handleUploadVideo}
                    disabled={uploadingVideo}
                    className="hidden"
                    accept="video/*"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
