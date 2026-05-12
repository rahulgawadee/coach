'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import apiService from '@/services/api';
import { Sparkles } from 'lucide-react';

const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,#06060f 0%,#090912 50%,#07070e 100%)' }} />
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.035 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#38bdf8" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)', filter:'blur(40px)' }} />
    <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%)', filter:'blur(40px)' }} />
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
    preferredWorkingHours: '',
    maxCandidateCapacity: 15,
    currentAssignment: 0,
    profilePictureUrl: '',
    videoIntroUrl: '',
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
  ];

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Coach')) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await apiService.coach.getProfile();
        setProfile(data.profile);
      } catch (err) {
        console.error('Profile error:', err);
        if (err.message === 'Unauthorized') {
          router.push('/login');
          return;
        }
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
      await apiService.coach.updateProfile(profile);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
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
    setError('');
    try {
      const signRes = await fetch('/api/candidate/cloudinary-sign?folder=techvance_coach_avatars', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const signData = await signRes.json();
      if (!signData.success) throw new Error('Failed to authenticate upload');

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
        setProfile({ ...profile, profilePictureUrl: uploadData.secure_url });
        await apiService.coach.updateProfile({ profilePictureUrl: uploadData.secure_url });
        updateUser({ avatarUrl: uploadData.secure_url });
        setSuccess('Profile picture updated!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Failed to upload picture');
      }
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
    setError('');
    try {
      const signRes = await fetch('/api/candidate/cloudinary-sign?folder=techvance_coach_intros', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const signData = await signRes.json();
      if (!signData.success) throw new Error('Failed to authenticate upload');

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
        setProfile({ ...profile, videoIntroUrl: uploadData.secure_url });
        await apiService.coach.updateProfile({ videoIntroUrl: uploadData.secure_url });
        setSuccess('Video uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Failed to upload video');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleAiEnhanceBio = async () => {
    if (!profile.bio && !profile.expertise?.length) {
      setError('Add a brief bio or expertise areas first so AI can enhance them.');
      return;
    }
    setAiEnhancing(true);
    try {
      const res = await fetch('/api/ai/enhance-bio', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: profile.bio,
          expertise: profile.expertise,
          yearsOfExperience: profile.yearsOfExperience,
          role: 'coach',
        })
      });
      const data = await res.json();
      if (data?.enhancedBio) {
        setProfile(prev => ({ ...prev, bio: data.enhancedBio }));
        setSuccess('AI has enhanced your bio!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('AI enhancement failed. Try again.');
    } finally {
      setAiEnhancing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid rgba(14,165,233,0.15)', borderTop:'1.5px solid #0ea5e9', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const InputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 outline-none text-white placeholder-slate-500 transition-all";

  return (
    <div className="relative max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      <BackgroundGrid />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');
        .profile-root { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .card {
          background: rgba(255,255,255,0.028);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .card:hover { border-color: rgba(255,255,255,0.11); box-shadow: 0 12px 40px rgba(0,0,0,0.35); }
        .section-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.4); margin-bottom: 8px; display: block;
        }
        .btn-primary {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:14px 24px; border-radius:14px; font-weight:600;
          font-size:14px; letter-spacing:0.02em; cursor:pointer; border:none;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color:#fff; box-shadow: 0 4px 20px rgba(2,132,199,0.25);
          transition: box-shadow 0.25s, transform 0.2s;
        }
        .btn-primary:hover { box-shadow: 0 8px 30px rgba(2,132,199,0.38); transform:translateY(-1px); }
        .btn-ghost {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:14px 24px; border-radius:14px; font-weight:600;
          font-size:14px; cursor:pointer;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.1);
          color:rgba(255,255,255,0.85);
          transition: background 0.2s, border-color 0.2s;
        }
        .btn-ghost:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); }
        .btn-ai {
          display:inline-flex; align-items:center; gap:6px;
          padding:10px 18px; border-radius:12px; font-weight:600; font-size:12px;
          letter-spacing:0.04em; cursor:pointer; border:none;
          background: linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(168,85,247,0.3) 100%);
          color:#c084fc; border:1px solid rgba(168,85,247,0.3);
          transition: all 0.2s;
        }
        .btn-ai:hover { background: linear-gradient(135deg, rgba(139,92,246,0.5) 0%, rgba(168,85,247,0.5) 100%); transform:translateY(-1px); }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .delay-1 { animation-delay:0.07s; }
        .delay-2 { animation-delay:0.14s; }
        .delay-3 { animation-delay:0.21s; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="profile-root space-y-8">

        {/* ── PAGE HEADER ── */}
        <div className="fade-up pt-8 px-4 sm:px-0">
          <h1 className="serif text-3xl sm:text-4xl text-white font-medium tracking-tight">Coach Profile</h1>
          <p className="text-slate-400 mt-2 font-light text-sm sm:text-base">Manage your identity, expertise, and availability.</p>
        </div>

        {/* ── ALERTS ── */}
        {error && (
          <div className="fade-up card p-4 border-red-500/20 bg-red-500/10 text-red-200 flex items-center gap-3">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="fade-up card p-4 border-emerald-500/20 bg-emerald-500/10 text-emerald-200 flex items-center gap-3">
            <span>✓</span> {success}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-8">

          {/* ── SECTION 1: PROFILE IDENTITY (TOP) ── */}
          <div className="fade-up delay-1 card overflow-hidden mx-4 sm:mx-0">
            {/* Hero accent */}
            <div className="relative p-6 sm:p-10 md:p-14 border-b border-white/7" style={{ background:'linear-gradient(135deg,rgba(14,165,233,0.12) 0%,rgba(79,70,229,0.08) 100%)' }}>
              <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-radial-gradient from-sky-500/15 to-transparent pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10 relative z-10">

                {/* PROFILE PHOTO UPLOAD */}
                <div className="flex-shrink-0 relative group">
                  <label className="cursor-pointer block">
                    <div style={{ width:110, height:110, borderRadius:20, overflow:'hidden', border:'2px solid rgba(14,165,233,0.3)', position:'relative', boxShadow:'0 8px 30px rgba(0,0,0,0.4)' }}>
                      {profile.profilePictureUrl && !uploadingPicture ? (
                        <img src={profile.profilePictureUrl} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      ) : uploadingPicture ? (
                        <div style={{ width:'100%', height:'100%', background:'rgba(14,165,233,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <div style={{ width:28, height:28, border:'2px solid rgba(14,165,233,0.3)', borderTop:'2px solid #0ea5e9', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                        </div>
                      ) : (
                        <div style={{ width:'100%', height:'100%', background:'rgba(14,165,233,0.1)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
                          <span style={{ fontSize:28 }}>👤</span>
                          <span style={{ fontSize:9, color:'rgba(14,165,233,0.8)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>Upload</span>
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', opacity:0, transition:'opacity 0.2s', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:18 }} className="group-hover:opacity-100">
                        <span style={{ fontSize:20 }}>📸</span>
                      </div>
                    </div>
                    <input type="file" onChange={handleUploadPicture} disabled={uploadingPicture} className="hidden" accept="image/*" />
                  </label>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center border-2 border-[#09090f] cursor-pointer shadow-lg hover:scale-110 transition-transform">
                    <span className="text-xs text-white">✎</span>
                  </div>
                </div>

                {/* IDENTITY TEXT */}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="serif text-2xl sm:text-3xl md:text-4xl text-white font-medium leading-tight">{profile.fullName || user?.name || 'Your Name'}</h2>
                  <p className="text-slate-400 mt-1.5 font-light text-sm sm:text-base">{profile.email}</p>
                  {profile.expertise?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                      {profile.expertise.slice(0, 3).map(e => (
                        <span key={e} className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-300 bg-sky-900/40 border border-sky-800/50 rounded-md">{e}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 mt-5 justify-center sm:justify-start">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span className="text-sky-400">⭐</span> {profile.yearsOfExperience || 0} yrs experience
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span className="text-sky-400">👥</span> Capacity: {profile.maxCandidateCapacity || 15}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal fields below the hero */}
            <div style={{ padding:'28px 36px' }}>
              <h3 className="serif text-xl text-white mb-5">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="section-label">Full Name</label>
                  <input type="text" name="fullName" value={profile.fullName} onChange={handleInputChange} className={InputClass} placeholder="Your full name" />
                </div>
                <div>
                  <label className="section-label">Email Address</label>
                  <input type="email" name="email" value={profile.email} className={InputClass} disabled title="Email cannot be changed" style={{ opacity:0.7, cursor:'not-allowed' }} />
                </div>
                <div>
                  <label className="section-label">Phone Number</label>
                  <input type="tel" name="phone" value={profile.phone || ''} onChange={handleInputChange} className={InputClass} placeholder="+1 555 000 0000" />
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: PROFESSIONAL INFORMATION ── */}
          <div className="fade-up delay-1 card p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="serif text-2xl text-white">Professional Information</h2>
              <button
                type="button"
                onClick={handleAiEnhanceBio}
                disabled={aiEnhancing}
                className="btn-ai"
              >
                <Sparkles size={14} />
                {aiEnhancing ? 'Enhancing...' : 'AI Enhance Bio'}
              </button>
            </div>

            <div className="mb-6">
              <label className="section-label">Bio / Professional Summary</label>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleInputChange}
                rows="4"
                className={`${InputClass} resize-none`}
                placeholder="Share your background, mentorship style, and what candidates can expect working with you..."
              />
              <p className="text-[10px] text-slate-500 mt-2">Tip: Use the AI Enhance button to automatically improve your bio using your expertise and experience.</p>
            </div>

            <div className="mb-6">
              <label className="section-label mb-4">Expertise Areas</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {expertiseOptions.map((expertise) => {
                  const isChecked = profile.expertise?.includes(expertise);
                  return (
                    <label key={expertise} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${isChecked ? 'bg-sky-500/10 border-sky-500/30 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${isChecked ? 'bg-sky-500 border-sky-500' : 'border-slate-500 bg-transparent'}`}>
                        {isChecked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                      </div>
                      <input type="checkbox" checked={isChecked} onChange={() => handleExpertiseToggle(expertise)} className="hidden" />
                      <span className="font-medium text-xs sm:text-sm">{expertise}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="section-label">Years of Experience</label>
                <input type="number" name="yearsOfExperience" value={profile.yearsOfExperience} onChange={handleInputChange} className={InputClass} min="0" />
              </div>
              <div>
                <label className="section-label">Certifications (Optional)</label>
                <input type="text" name="certifications" value={profile.certifications || ''} onChange={handleInputChange} placeholder="e.g., ICF Coach, PCC" className={InputClass} />
              </div>
            </div>
          </div>

          {/* ── SECTION 3: AVAILABILITY ── */}
          <div className="fade-up delay-2 card p-6 sm:p-8 mx-4 sm:mx-0">
            <h2 className="serif text-xl sm:text-2xl text-white mb-6">Availability & Capacity</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <label className="section-label">Working Hours</label>
                <input type="text" name="preferredWorkingHours" value={profile.preferredWorkingHours || ''} onChange={handleInputChange} placeholder="e.g., 9 AM – 5 PM" className={InputClass} />
              </div>
              <div>
                <label className="section-label">Max Candidate Capacity</label>
                <input type="number" name="maxCandidateCapacity" value={profile.maxCandidateCapacity} onChange={handleInputChange} min="1" max="50" className={InputClass} />
              </div>
              <div>
                <label className="section-label">Current Mentees</label>
                <div className={`${InputClass} flex items-center justify-between opacity-70 cursor-not-allowed`} style={{ pointerEvents:'none' }}>
                  <span className="text-white font-bold text-lg">{profile.currentAssignment || 0}</span>
                  <span className="text-slate-500 font-medium">/ {profile.maxCandidateCapacity}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 4: MEDIA (VIDEO INTRO) ── */}
          <div className="fade-up delay-3 card p-8">
            <h2 className="serif text-2xl text-white mb-6">Video Introduction</h2>
            <p className="text-slate-400 font-light text-sm mb-5">Upload a short intro video so candidates can get to know you before connecting.</p>
            <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/5 transition-all relative overflow-hidden group">
              {profile.videoIntroUrl && !uploadingVideo ? (
                <>
                  <div className="absolute inset-0 bg-sky-900/30 flex items-center justify-center">
                    <span className="text-5xl">🎥</span>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">🎥</span>
                    <span className="text-xs font-bold text-white uppercase tracking-widest bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">Change Video</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-4xl mb-3">🎥</span>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                    {uploadingVideo ? 'Uploading...' : 'Click to Upload Video'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">MP4, MOV up to 100MB</span>
                </>
              )}
              <input type="file" onChange={handleUploadVideo} disabled={uploadingVideo} className="hidden" accept="video/*" />
            </label>
          </div>

          {/* ── SAVE ACTIONS ── */}
          <div className="fade-up delay-3 flex flex-col sm:flex-row gap-4 pt-4 px-4 sm:px-0">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
