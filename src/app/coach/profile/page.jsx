'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import apiService from '@/services/api';
import { Sparkles, Camera } from 'lucide-react';

const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position:'absolute', inset:0, background:'var(--background)' }} />
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.035 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 72 0 L 0 0 0 72" fill="none" stroke="var(--primary)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter:'blur(40px)' }} />
    <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter:'blur(40px)' }} />
  </div>
);

export default function CoachProfilePage() {
  const router = useRouter();
  const { isAuthenticated, hasRole, user, updateUser } = useAuth();
  const [authToken] = useLocalStorage('token', '');
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    expertise: [],
    yearsOfExperience: 0,
    certifications: '',
    languages: [],
    preferredWorkingHours: { startTime: '09:00', endTime: '17:00', timezone: 'Europe/Stockholm' },
    maxCandidates: 15,
    currentAssignmentCount: 0,
    profilePictureUrl: '',
    videoIntroductionUrl: '',
    averageRating: 4.9,
    reviewCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [aiEnhancing, setAiEnhancing] = useState(false);

  const expertiseOptions = [
    'Career Coaching',
    'Interview Preparation',
    'CV Writing',
    'Job Search Strategy',
    'Professional Development',
    'Leadership Skills',
    'Communication Skills',
    'Sales Training',
    'Technical Interviewing',
    'Negotiation'
  ];

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Coach')) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await apiService.coach.getProfile();
        if (data.success && data.profile) {
          setProfile(data.profile);
        }
      } catch (err) {
        console.error('Profile load error:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isAuthenticated, hasRole, authToken, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkingHoursChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      preferredWorkingHours: {
        ...prev.preferredWorkingHours,
        [name]: value
      }
    }));
  };

  const handleExpertiseToggle = (expertise) => {
    setProfile(prev => {
      const current = prev.expertise || [];
      return {
        ...prev,
        expertise: current.includes(expertise)
          ? current.filter(e => e !== expertise)
          : [...current, expertise]
      };
    });
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiService.coach.updateProfile(profile);
      if (res.success) {
        setSuccess('Profile updated successfully!');
        if (profile.fullName) updateUser({ name: profile.fullName });
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPicture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPicture(true);
    setError('');
    try {
      const signRes = await fetch('/api/candidate/cloudinary-sign?folder=techvance_coach_avatars');
      const signData = await signRes.json();
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp);
      formData.append('signature', signData.signature);
      formData.append('folder', 'techvance_coach_avatars');

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();
      
      if (uploadData.secure_url) {
        setProfile(prev => ({ ...prev, profilePictureUrl: uploadData.secure_url }));
        await apiService.coach.updateProfile({ profilePictureUrl: uploadData.secure_url });
        updateUser({ avatarUrl: uploadData.secure_url });
        setSuccess('Profile picture updated!');
      }
    } catch (err) {
      setError('Failed to upload picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleUploadVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    setError('');
    try {
      const signRes = await fetch('/api/candidate/cloudinary-sign?folder=techvance_coach_intros');
      const signData = await signRes.json();
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp);
      formData.append('signature', signData.signature);
      formData.append('folder', 'techvance_coach_intros');

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`, {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();
      
      if (uploadData.secure_url) {
        setProfile(prev => ({ ...prev, videoIntroductionUrl: uploadData.secure_url }));
        await apiService.coach.updateProfile({ videoIntroductionUrl: uploadData.secure_url });
        setSuccess('Intro video updated!');
      }
    } catch (err) {
      setError('Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleAiEnhanceBio = async () => {
    if (!profile.bio && !profile.expertise?.length) {
      setError('Add some bio details or expertise first.');
      return;
    }
    setAiEnhancing(true);
    try {
      const res = await apiService.ai.enhanceBio({
        bio: profile.bio,
        expertise: profile.expertise,
        yearsOfExperience: profile.yearsOfExperience,
        role: 'coach',
      });
      if (res?.enhancedBio) {
        setProfile(prev => ({ ...prev, bio: res.enhancedBio }));
        setSuccess('AI has polished your bio!');
      }
    } catch (err) {
      setError('AI enhancement failed');
    } finally {
      setAiEnhancing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-2 border-var(--primary) border-opacity-20 border-t-var(--primary) rounded-full animate-spin" />
        <p className="text-var(--text-muted) text-sm font-medium animate-pulse">Loading Coach Identity...</p>
      </div>
    );
  }

  const InputClass = "w-full px-4 py-3 bg-var(--input-bg) border border-transparent rounded-2xl focus:ring-2 focus:ring-var(--primary-glow) focus:border-var(--primary) outline-none text-var(--text-primary) placeholder-var(--text-muted) transition-all text-sm";

  return (
    <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-24 animate-in fade-in duration-700">
      <BackgroundGrid />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');
        .profile-root { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .glass-card {
          background: var(--card-bg);
          border-radius: 32px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
          backdrop-filter: blur(24px);
        }
        .section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--text-muted); margin-bottom: 12px; display: block;
        }
        .btn-primary {
          display:flex; align-items:center; justify-content:center; gap:10px;
          padding:16px 32px; border-radius:18px; font-weight:700;
          font-size:15px; cursor:pointer; border:none;
          background: var(--primary);
          color:#fff; box-shadow: 0 8px 25px var(--primary-glow);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 35px var(--primary-glow); filter: brightness(1.1); }
        .btn-primary:active { transform: translateY(0); }
        .btn-ai {
          display:inline-flex; align-items:center; gap:8px;
          padding:12px 20px; border-radius:14px; font-weight:700; font-size:12px;
          background: var(--primary-glow); color: var(--primary);
          border: 1px solid var(--primary); border-opacity: 20; transition: all 0.2s;
        }
        .btn-ai:hover { background: rgba(14, 165, 233, 0.2); transform: scale(1.02); }
      `}</style>

      <div className="profile-root">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pt-10">
          <div>
            <h1 className="serif text-4xl sm:text-5xl lg:text-6xl text-var(--text-primary) font-medium tracking-tight">Professional Profile</h1>
            <p className="text-var(--text-muted) mt-4 font-light text-lg max-w-2xl leading-relaxed">
              Define your coaching expertise and manage how you appear to aspiring candidates.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.back()} className="px-6 py-4 rounded-2xl border border-var(--card-border) text-var(--text-primary) font-bold hover:bg-var(--primary-glow) transition-all">
              Cancel
            </button>
            <button onClick={handleSaveProfile} disabled={saving} className="btn-primary min-w-[200px]">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* STATUS MESSAGES */}
        {(error || success) && (
          <div className={`mb-8 p-5 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-4 ${error ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
            <span className="text-xl">{error ? '⚠️' : '✅'}</span>
            <span className="font-medium">{error || success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: IDENTITY & MEDIA */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* AVATAR CARD */}
            <div className="glass-card p-10 flex flex-col items-center text-center">
              <div className="relative group mb-6">
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-var(--primary) border-opacity-20 bg-var(--card-bg) shadow-2xl relative">
                  {profile.profilePictureUrl ? (
                    <img src={profile.profilePictureUrl} alt="Coach" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl opacity-20 text-var(--text-primary)">👤</div>
                  )}
                  {uploadingPicture && (
                    <div className="absolute inset-0 bg-var(--background) bg-opacity-60 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-var(--primary) border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-var(--primary) text-white flex items-center justify-center cursor-pointer shadow-xl hover:scale-110 transition-all border-4 border-var(--background)">
                  <Camera size={20} strokeWidth={2.5} />
                  <input type="file" onChange={handleUploadPicture} className="hidden" accept="image/*" />
                </label>
              </div>
              <h3 className="serif text-2xl text-var(--text-primary) mb-1">{profile.fullName || 'New Coach'}</h3>
              <p className="text-var(--primary) text-sm font-bold uppercase tracking-widest mb-6">Certified Career Coach</p>
              
              <div className="w-full grid grid-cols-2 gap-4 pt-6 border-t border-var(--card-border)">
                <div className="text-center">
                  <p className="text-2xl font-bold text-var(--text-primary)">{profile.averageRating}</p>
                  <p className="text-[10px] text-var(--text-muted) uppercase font-bold tracking-widest">Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-var(--text-primary)">{profile.currentAssignmentCount}</p>
                  <p className="text-[10px] text-var(--text-muted) uppercase font-bold tracking-widest">Active Mentees</p>
                </div>
              </div>
            </div>

            {/* VIDEO INTRO CARD */}
            <div className="glass-card p-8">
              <label className="section-label">Intro Video</label>
              <div className="aspect-video rounded-2xl bg-var(--background) bg-opacity-40 border-2 border-dashed border-var(--card-border) flex flex-col items-center justify-center relative group overflow-hidden">
                {profile.videoIntroductionUrl ? (
                  <video src={profile.videoIntroductionUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-6">
                    <span className="text-4xl mb-4 block">🎥</span>
                    <p className="text-var(--text-muted) text-xs font-bold uppercase tracking-widest leading-relaxed">
                      Share your vision with<br/>potential candidates
                    </p>
                  </div>
                )}
                <label className="absolute inset-0 bg-var(--primary-glow) bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                  <span className="bg-var(--background) text-var(--primary) px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl">
                    {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                  </span>
                  <input type="file" onChange={handleUploadVideo} className="hidden" accept="video/*" />
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DETAILS */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* GENERAL INFO SECTION */}
            <div className="glass-card p-8 sm:p-10">
              <h4 className="serif text-2xl text-var(--text-primary) mb-8 border-b border-var(--card-border) pb-6">General Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="section-label">Full Professional Name</label>
                  <input name="fullName" value={profile.fullName} onChange={handleInputChange} className={InputClass} placeholder="John Doe" />
                </div>
                <div>
                  <label className="section-label">Direct Phone Number</label>
                  <input name="phone" value={profile.phone} onChange={handleInputChange} className={InputClass} placeholder="+46 70 123 45 67" />
                </div>
                <div>
                  <label className="section-label">Official Email</label>
                  <input value={profile.email} disabled className={`${InputClass} opacity-50 cursor-not-allowed`} />
                </div>
              </div>
            </div>

            {/* PROFESSIONAL INFO SECTION */}
            <div className="glass-card p-8 sm:p-10">
              <div className="flex items-center justify-between mb-8 border-b border-var(--card-border) pb-6">
                <h4 className="serif text-2xl text-var(--text-primary)">Professional Background</h4>
                <button onClick={handleAiEnhanceBio} disabled={aiEnhancing} className="btn-ai">
                  <Sparkles size={14} /> {aiEnhancing ? 'Writing...' : 'AI Enhance'}
                </button>
              </div>
              
              <div className="space-y-8">
                <div>
                  <label className="section-label">Professional Bio</label>
                  <textarea name="bio" value={profile.bio} onChange={handleInputChange} rows="6" className={`${InputClass} resize-none leading-relaxed p-6`} placeholder="Craft your professional narrative..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="section-label">Years of Experience</label>
                    <input type="number" name="yearsOfExperience" value={profile.yearsOfExperience} onChange={handleInputChange} className={InputClass} min="0" />
                  </div>
                  <div>
                    <label className="section-label">Key Certifications</label>
                    <input name="certifications" value={profile.certifications} onChange={handleInputChange} className={InputClass} placeholder="e.g. ICF-PCC, CIPD" />
                  </div>
                </div>

                <div>
                  <label className="section-label">Expertise Areas</label>
                  <div className="flex flex-wrap gap-3">
                    {expertiseOptions.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleExpertiseToggle(opt)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                          profile.expertise?.includes(opt) 
                          ? 'bg-var(--primary) border-var(--primary) text-white shadow-lg shadow-var(--primary-glow)' 
                          : 'bg-var(--card-bg) border-var(--card-border) text-var(--text-muted) hover:bg-var(--primary-glow)'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CAPACITY & HOURS SECTION */}
            <div className="glass-card p-8 sm:p-10">
              <h4 className="serif text-2xl text-var(--text-primary) mb-8 border-b border-var(--card-border) pb-6">Availability & Workload</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="section-label">Start Time</label>
                  <input type="time" name="startTime" value={profile.preferredWorkingHours?.startTime || '09:00'} onChange={handleWorkingHoursChange} className={InputClass} />
                </div>
                <div>
                  <label className="section-label">End Time</label>
                  <input type="time" name="endTime" value={profile.preferredWorkingHours?.endTime || '17:00'} onChange={handleWorkingHoursChange} className={InputClass} />
                </div>
                <div>
                  <label className="section-label">Max Capacity</label>
                  <input type="number" name="maxCandidates" value={profile.maxCandidates} onChange={handleInputChange} className={InputClass} min="5" max="50" />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM ACTIONS MOBILE */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-var(--background) bg-opacity-80 backdrop-blur-xl border-t border-var(--card-border) z-50 flex gap-3">
          <button onClick={handleSaveProfile} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
