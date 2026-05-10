"use client";

import { useState, useEffect, useRef } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { UserCircle, Briefcase, Video, ShieldCheck, Sparkles, Save, CheckCircle2, AlertCircle } from 'lucide-react';

const INDUSTRIES = ['IT', 'Healthcare', 'Construction', 'Finance', 'Education', 'Other'];

const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#06060f 0%,#090912 50%,#07070e 100%)' }} />
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .035 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#6366f1" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position: 'absolute', top: '-20%', left: '-15%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
    <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,116,144,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
  </div>
);

export default function ProfilePage() {
  const [user, setUser] = useLocalStorage('user', {});
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    personnummer: '',
    startDate: '',
    finishDate: '',
    coachName: '',
    companyName: '',
    videoUrl: '',
    avatarUrl: '',
    industries: [],
    skills: [],
    employmentStatus: 'Unemployed',
    marketingConsent: false,
    dataConsent: false,
  });
  const [status, setStatus] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [playingVideo, setPlayingVideo] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (user?.email) {
      setForm((prev) => ({
        ...prev,
        email: user.email || '',
        coachName: user.coachName || '',
        companyName: user.companyName || '',
      }));

      const loadProfile = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/candidate/profile?email=${encodeURIComponent(user.email)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const payload = await res.json();
          if (payload?.success && payload.data) {
            setForm(prev => ({ ...prev, ...payload.data, personnummer: payload.data.hasPersonnummer || '' }));
          }
        } catch (e) {
          console.error('Failed to load profile', e);
        }
      };
      loadProfile();
    }
  }, [user?.email]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveProfile = async () => {
    setStatus(null);

    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      setStatus({ type: 'error', message: 'Please complete all required personal fields.' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json();
      if (!payload.success) {
        setStatus({ type: 'error', message: payload.error || 'Failed to save profile' });
        return;
      }

      setUser({ ...user, ...form });
      setStatus({ type: 'success', message: 'Profile saved successfully!' });

      // Auto-clear success message
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error occurred.' });
    }
  };

  const enhanceProfile = async () => {
    if (!aiPrompt.trim()) {
      setStatus({ type: 'error', message: 'Please provide some details for the AI.' });
      return;
    }

    setAiModalOpen(false);
    setStatus({ type: 'info', message: 'Enhancing profile with AI...' });

    try {
      const response = await fetch('/api/ai/profile-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: { ...form, prompt: aiPrompt } }),
      });

      const payload = await response.json();
      if (!payload.success) {
        setStatus({ type: 'error', message: payload.error || 'AI enhancement failed' });
        return;
      }

      setForm((prev) => ({
        ...prev,
        skills: Array.from(new Set([...(prev.skills || []), ...(payload.data?.skills || [])])),
        bio: payload.data?.bio || prev.bio,
      }));
      setStatus({ type: 'success', message: 'AI suggestions applied to your skills!' });

      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', message: 'AI enhancement failed.' });
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setStatus({ type: 'error', message: 'Video must be less than 20MB.' });
      return;
    }
    setSelectedVideo(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const cancelVideoUpload = () => {
    setSelectedVideo(null);
    setPreviewUrl('');
  };

  const confirmVideoUpload = async () => {
    if (!selectedVideo) return;

    setIsUploading(true);
    setStatus({ type: 'info', message: 'Uploading your video securely. Please wait...' });

    try {
      const signRes = await fetch('/api/candidate/cloudinary-sign?folder=techvance_candidate_intros');
      const signData = await signRes.json();

      if (!signData.success) {
        setStatus({ type: 'error', message: 'Failed to authenticate upload. Check your connection.' });
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedVideo);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp);
      formData.append('signature', signData.signature);
      formData.append('folder', 'techvance_candidate_intros');

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`, {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadRes.json();

      if (uploadData.secure_url) {
        updateField('videoUrl', uploadData.secure_url);
        setSelectedVideo(null);
        setPreviewUrl('');

        // Auto-save the video to the database immediately
        try {
          const token = localStorage.getItem('token');
          await fetch('/api/candidate/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ...form, videoUrl: uploadData.secure_url }),
          });
        } catch (saveErr) {
          console.error('Failed to auto-save video URL to profile', saveErr);
        }

        setStatus({ type: 'success', message: 'Video uploaded and saved successfully!' });
        setTimeout(() => setStatus(null), 4000);
      } else {
        setStatus({ type: 'error', message: uploadData.error?.message || 'Failed to upload video.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Network error occurred during video upload.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', message: 'Only image files are allowed for avatars.' });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const confirmAvatarUpload = async () => {
    if (!avatarFile) return;

    setIsUploading(true);
    setStatus({ type: 'info', message: 'Uploading your avatar...' });

    try {
      const signRes = await fetch('/api/candidate/cloudinary-sign?folder=techvance_candidate_avatars');
      const signData = await signRes.json();

      if (!signData.success) {
        setStatus({ type: 'error', message: 'Failed to authenticate upload.' });
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', avatarFile);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp);
      formData.append('signature', signData.signature);
      formData.append('folder', 'techvance_candidate_avatars');

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadRes.json();

      if (uploadData.secure_url) {
        updateField('avatarUrl', uploadData.secure_url);
        setUser({ ...user, avatarUrl: uploadData.secure_url });
        setAvatarFile(null);
        setAvatarPreview('');

        try {
          const token = localStorage.getItem('token');
          await fetch('/api/candidate/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ...form, avatarUrl: uploadData.secure_url }),
          });
        } catch (saveErr) {
          console.error(saveErr);
        }

        setStatus({ type: 'success', message: 'Avatar uploaded and saved successfully!' });
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus({ type: 'error', message: 'Failed to upload avatar.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Network error occurred.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-500 font-['DM_Sans',sans-serif]">
      <BackgroundGrid />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .glass-panel {
          background: rgba(255,255,255,0.015);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(24px);
          border-radius: 24px;
        }
        .input-dark {
          width: 100%; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.03); color: #fff; padding: 12px 16px;
          font-size: 14px; font-weight: 400; transition: all 0.2s; outline: none;
        }
        .input-dark:focus { border-color: rgba(99,102,241,0.5); background: rgba(255,255,255,0.06); }
        .input-dark::placeholder { color: rgba(255,255,255,0.3); }
        .input-dark:read-only { opacity: 0.6; cursor: not-allowed; }
        
        .btn-primary {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 28px; border-radius: 14px;
          font-size: 14px; font-weight: 700; cursor: pointer; border: none;
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color: #fff; box-shadow: 0 4px 20px rgba(99,102,241,0.25);
          transition: all 0.2s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(99,102,241,0.35); }
        
        .btn-ai {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 28px; border-radius: 14px;
          font-size: 14px; font-weight: 700; cursor: pointer; border: none;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff; box-shadow: 0 4px 20px rgba(16,185,129,0.25);
          transition: all 0.2s;
        }
        .btn-ai:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(16,185,129,0.35); }
        
        .btn-outline {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 10px 20px; border-radius: 12px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          color: #e2e8f0; transition: all 0.2s;
        }
        .btn-outline:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
        
        .section-title {
          font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;
          letter-spacing: 0.2em; display: flex; align-items: center; gap: 8px; margin-bottom: 24px;
        }
        .form-label {
          display: block; font-size: 11px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; padding-left: 4px;
        }
      `}</style>

      {/* Header */}
      <div className="glass-panel p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-black/20">
        <div className="flex items-center gap-6">
          {/* Avatar Area */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#0f0e1c] border border-white/10 flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={40} className="text-indigo-400 opacity-50" />
              )}
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <label className="text-[10px] font-bold text-center px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer text-slate-300 transition-colors">
                Change Image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarSelect(e.target.files?.[0])} disabled={isUploading} />
              </label>
              {avatarFile && (
                <button type="button" onClick={confirmAvatarUpload} disabled={isUploading} className="text-[10px] font-bold text-center px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
                  {isUploading ? 'Uploading...' : 'Save Image'}
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-4">
              <UserCircle size={12} />
              My Identity
            </div>
            <h1 className="serif text-3xl md:text-4xl text-white leading-tight mb-2">Complete Profile</h1>
            <p className="text-slate-400 font-light text-sm mb-4">Manage your personal information and program preferences.</p>

            {form.videoUrl && !selectedVideo && (
              <button
                type="button"
                onClick={() => setPlayingVideo(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-indigo-500/20 hover:border-indigo-500/30 hover:text-indigo-300 transition-all shadow-lg"
              >
                <Video size={14} className="text-indigo-400" />
                Play Intro Video
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button className="btn-ai" onClick={() => setAiModalOpen(true)}>
            <Sparkles size={18} /> Enhance with AI
          </button>
          <button className="btn-primary" onClick={saveProfile}>
            <Save size={18} /> Save Changes
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {status && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${status.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
            status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
          }`}>
          {status.type === 'error' ? <AlertCircle size={18} /> :
            status.type === 'success' ? <CheckCircle2 size={18} /> :
              <Sparkles size={18} />}
          <span className="text-sm font-bold">{status.message}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Info */}
        <section className="glass-panel p-8">
          <h2 className="section-title"><UserCircle size={16} className="text-indigo-400" /> Personal Information</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="form-label">First Name</label>
              <input className="input-dark" placeholder="John" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input className="input-dark" placeholder="Doe" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Email Address</label>
              <input className="input-dark" value={form.email} readOnly />
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input className="input-dark" placeholder="+46 ..." value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Address</label>
              <input className="input-dark" placeholder="Street, City" value={form.address} onChange={(e) => updateField('address', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Personnummer</label>
              <input className="input-dark" placeholder="YYYYMMDD-XXXX" value={form.personnummer} onChange={(e) => updateField('personnummer', e.target.value)} />
            </div>
          </div>
        </section>

        {/* Program Info */}
        <section className="glass-panel p-8">
          <h2 className="section-title"><Briefcase size={16} className="text-indigo-400" /> Program Information</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" className="input-dark" style={{ colorScheme: 'dark' }} value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Finish Date</label>
              <input type="date" className="input-dark" style={{ colorScheme: 'dark' }} value={form.finishDate} onChange={(e) => updateField('finishDate', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Assigned Coach</label>
              <input className="input-dark" value={form.coachName || 'Not assigned yet'} readOnly />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Coach Company</label>
              <input className="input-dark" value={form.companyName || 'Not assigned yet'} readOnly />
            </div>
          </div>
        </section>

        {/* Professional Details */}
        <section className="glass-panel p-8">
          <h2 className="section-title"><Briefcase size={16} className="text-indigo-400" /> Professional Details</h2>
          <div className="space-y-6">
            <div>
              <label className="form-label">Industrial Fields</label>
              <div className="mt-3 flex flex-wrap gap-2">
                {INDUSTRIES.map((industry) => {
                  const isSelected = (form.industries || []).includes(industry);
                  return (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => {
                        const set = new Set(form.industries || []);
                        if (set.has(industry)) set.delete(industry);
                        else set.add(industry);
                        updateField('industries', Array.from(set));
                      }}
                      className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${isSelected
                          ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                    >
                      {industry}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="form-label">Core Skills</label>
              <input
                className="input-dark"
                placeholder="E.g. JavaScript, Project Management, Sales"
                value={(form.skills || []).join(', ')}
                onChange={(e) => updateField('skills', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              />
              <p className="text-[10px] text-slate-500 mt-2 uppercase font-bold tracking-widest pl-1">Separate with commas</p>
            </div>

            <div>
              <label className="form-label">Employment Status</label>
              <select
                className="input-dark appearance-none"
                value={form.employmentStatus}
                onChange={(e) => updateField('employmentStatus', e.target.value)}
              >
                <option className="bg-[#0f0e1c]">Employed</option>
                <option className="bg-[#0f0e1c]">Unemployed</option>
                <option className="bg-[#0f0e1c]">Student</option>
              </select>
            </div>
          </div>
        </section>

        {/* Video Profile */}
        <section className="glass-panel p-8">
          <h2 className="section-title"><Video size={16} className="text-indigo-400" /> Video Introduction</h2>
          <div className="space-y-6">
            <p className="text-sm font-light text-slate-400 leading-relaxed">
              Upload a short 1-2 minute video introducing yourself to potential employers. This greatly increases your chances of standing out.
            </p>

            <div className="flex flex-wrap gap-3">
              <label className="btn-outline cursor-pointer border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-500/50">
                Choose Video
                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0])} disabled={isUploading} />
              </label>
              <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()} disabled={isUploading}>
                Record WebCam
              </button>
              {form.videoUrl && !selectedVideo && (
                <button type="button" className="btn-outline border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50" onClick={() => updateField('videoUrl', '')} disabled={isUploading}>
                  Remove Current Video
                </button>
              )}
            </div>

            {selectedVideo && previewUrl && (
              <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-300">Preview Mode</h4>
                    <p className="text-xs text-slate-400">Review your video before uploading</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={cancelVideoUpload} disabled={isUploading} className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors">
                      Cancel
                    </button>
                    <button type="button" onClick={confirmVideoUpload} disabled={isUploading} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors flex items-center gap-2">
                      {isUploading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Uploading...
                        </>
                      ) : (
                        'Confirm & Upload'
                      )}
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden border border-indigo-500/20 bg-black/50 aspect-video relative">
                  <video className="w-full h-full object-contain" controls src={previewUrl} />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                      <span className="text-sm font-bold text-white tracking-widest uppercase animate-pulse">Uploading your video...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!selectedVideo && form.videoUrl ? (
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/50 aspect-video relative">
                <video className="w-full h-full object-contain" controls src={form.videoUrl} />
              </div>
            ) : (!selectedVideo && !form.videoUrl && (
              <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/5 aspect-video flex flex-col items-center justify-center text-slate-500">
                <Video size={32} className="mb-2 opacity-50" />
                <span className="text-xs font-bold uppercase tracking-widest">No video uploaded</span>
              </div>
            ))}
          </div>
        </section>

        {/* Consents */}
        <section className="glass-panel p-8 lg:col-span-2">
          <h2 className="section-title"><ShieldCheck size={16} className="text-indigo-400" /> Legal & Privacy</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-start gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={form.marketingConsent}
                  onChange={(e) => updateField('marketingConsent', e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 appearance-none checked:bg-indigo-500 checked:border-indigo-500 transition-colors cursor-pointer"
                />
                {form.marketingConsent && <CheckCircle2 size={14} className="text-white absolute pointer-events-none" strokeWidth={3} />}
              </div>
              <div>
                <span className="text-sm font-bold text-white block mb-1">Marketing Consent</span>
                <span className="text-xs text-slate-400 font-light">I agree to receive job opportunities, newsletters, and promotional content related to career growth.</span>
              </div>
            </label>

            <label className="flex items-start gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={form.dataConsent}
                  onChange={(e) => updateField('dataConsent', e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 appearance-none checked:bg-indigo-500 checked:border-indigo-500 transition-colors cursor-pointer"
                />
                {form.dataConsent && <CheckCircle2 size={14} className="text-white absolute pointer-events-none" strokeWidth={3} />}
              </div>
              <div>
                <span className="text-sm font-bold text-white block mb-1">Data Processing Consent</span>
                <span className="text-xs text-slate-400 font-light">I agree that Techvance may process my personal data to match me with suitable coaches and employers.</span>
              </div>
            </label>
          </div>
        </section>
      </div>

      {/* AI Enhancement Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f0e1c] border border-emerald-500/20 shadow-[0_24px_50px_rgba(0,0,0,0.6)] rounded-3xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 relative">

            {/* Subtle glow background */}
            <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none" />

            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-400" />
                  AI Profile Enhancement
                </h3>
                <p className="text-xs text-slate-400 mt-1">Let's build your professional identity.</p>
              </div>
              <button onClick={() => setAiModalOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-500/20 transition-colors">
                <ShieldCheck size={16} className="rotate-45" /> {/* Using ShieldCheck as cross by rotating or just text 'X' if no icon */}
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm text-emerald-200 leading-relaxed font-light shadow-inner">
                <strong className="text-emerald-400 font-bold block mb-1">Tell me about your background</strong>
                To generate the best skills and professional profile for you, please briefly describe your past experience, current goals, and any tools you use.
              </div>

              <div className="space-y-3">
                <textarea
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:bg-white/10 transition-all outline-none font-medium h-32 resize-none"
                  placeholder="E.g., I have 5 years of experience in retail management and I want to transition into B2B sales..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
              <button className="btn-outline !w-auto" onClick={() => setAiModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-ai !w-auto" onClick={enhanceProfile}>
                Generate with AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Overlay Modal */}
      {playingVideo && form.videoUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setPlayingVideo(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-black/50 border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={() => setPlayingVideo(false)}
                className="w-10 h-10 rounded-full bg-black/50 border border-white/20 text-white flex items-center justify-center hover:bg-white/10 backdrop-blur-md transition-all"
              >
                <ShieldCheck size={20} className="rotate-45" />
              </button>
            </div>
            <video
              src={form.videoUrl}
              controls
              autoPlay
              className="w-full h-auto aspect-video object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
