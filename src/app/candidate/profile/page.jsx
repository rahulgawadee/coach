"use client";

import { useState, useEffect, useRef } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import Script from 'next/script';
import { UserCircle, Briefcase, Video, ShieldCheck, Sparkles, Save, CheckCircle2, AlertCircle, X, FileText, Upload, GraduationCap, MapPin, Phone, Mail } from 'lucide-react';

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
    bio: '',
    resumeUrl: '',
    resumeName: '',
    industries: [],
    skills: [],
    employmentStatus: 'Unemployed',
    marketingConsent: false,
    dataConsent: false,
  });
  const [status, setStatus] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const savedFormRef = useRef(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [playingVideo, setPlayingVideo] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [previewResumeUrl, setPreviewResumeUrl] = useState('');
  const [showResumeNamePrompt, setShowResumeNamePrompt] = useState(false);
  const [tempResumeName, setTempResumeName] = useState('');
  const fileRef = useRef(null);
  const resumeFileRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

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
          console.log('Frontend Profile Payload:', payload);
          if (payload?.success && payload.data) {
            setForm(prev => {
              const next = { ...prev, ...payload.data, personnummer: payload.data.hasPersonnummer || '' };
              console.log('Frontend Profile Form Updated:', next);
              savedFormRef.current = { ...next };
              return next;
            });
          }
        } catch (e) {
          console.error('Failed to load profile', e);
        }
      };
      loadProfile();
    }
  }, [user?.email]);

  useEffect(() => {
    if (showRecorder && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [showRecorder]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setShowRecorder(true);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setStatus({ type: 'error', message: 'Could not access webcam. Please check permissions.' });
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowRecorder(false);
    setIsRecording(false);
    setRecordingTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    setRecordedChunks([]);
    const options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }
    }

    const mediaRecorder = new MediaRecorder(streamRef.current, options);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    mediaRecorder.onstop = () => {
      setRecordedChunks((chunks) => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], `webcam-record-${Date.now()}.webm`, { type: 'video/webm' });
        handleFileSelect(file);
        return [];
      });
      stopWebcam();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);

    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const generateSummaryAI = async () => {
    setIsAiGenerating(true);
    setLoadingMessage('AI is analyzing your profile to craft a summary...');
    setStatus(null);
    try {
      const response = await fetch('/api/ai/profile-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: form.firstName, profile: form }),
      });
      const payload = await response.json();

      if (payload.success && payload.data) {
        const data = payload.data;
        const newBio = typeof data === 'string' ? data : data.bio;

        setForm(prev => ({
          ...prev,
          bio: newBio || prev.bio,
          skills: data.skills ? Array.from(new Set([...(prev.skills || []), ...data.skills])) : prev.skills
        }));

        setStatus({ type: 'success', message: 'Professional summary and skills updated!' });
        setTimeout(() => setStatus(null), 3000);
      } else {
        throw new Error('AI failed to generate summary');
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to generate summary with AI.' });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleResumeUpload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setStatus({ type: 'error', message: 'Resume must be less than 10MB.' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: 'info', message: 'Uploading resume...' });

    try {
      const signRes = await fetch('/api/candidate/cloudinary-sign?folder=techvance_resumes&use_filename=true&unique_filename=false&type=upload');
      const signData = await signRes.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp);
      formData.append('signature', signData.signature);
      formData.append('folder', 'techvance_resumes');
      formData.append('use_filename', 'true');
      formData.append('unique_filename', 'false');
      formData.append('type', 'upload');

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadRes.json();
      if (uploadData.secure_url) {
        const newUrl = uploadData.secure_url;
        const newName = file.name;

        // Update local state first
        setForm(prev => ({ ...prev, resumeUrl: newUrl, resumeName: newName }));

        // Auto-save to DB with latest state
        try {
          const token = localStorage.getItem('token');
          await fetch('/api/candidate/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ...form, resumeUrl: newUrl, resumeName: newName }),
          });
        } catch (saveErr) {
          console.error('Failed to auto-save resume URL', saveErr);
        }

        setStatus({ type: 'success', message: 'Resume saved to your profile successfully!' });
        setTimeout(() => setStatus(null), 4000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to upload resume.' });
    } finally {
      setIsUploading(false);
    }
  };

  const generateResumeAI = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.skills.length) {
      setStatus({ type: 'error', message: 'Please fill in your name, email, and skills first.' });
      return;
    }
    setTempResumeName(`Resume_${form.firstName}_${form.lastName}`);
    setShowResumeNamePrompt(true);
  };

  const confirmGenerateResumeAI = async () => {
    if (!window.jspdf) {
      setStatus({ type: 'error', message: 'PDF library still loading. Please try again.' });
      return;
    }

    setShowResumeNamePrompt(false);
    setIsAiGenerating(true);
    setLoadingMessage('AI is generating your professional resume...');
    setStatus(null);

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Basic PDF Layout
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text(`${form.firstName} ${form.lastName}`, 20, 25);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${form.email} | ${form.phone || 'Phone not provided'}`, 20, 32);
      doc.text(`${form.address || 'Address not provided'}`, 20, 37);

      doc.setLineWidth(0.5);
      doc.line(20, 42, 190, 42);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Professional Summary", 20, 52);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const splitBio = doc.splitTextToSize(form.bio || "Active candidate in the Techvance program.", 170);
      doc.text(splitBio, 20, 60);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Core Skills", 20, 90);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(form.skills.join(", "), 20, 98);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Industries", 20, 110);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(form.industries.join(", "), 20, 118);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Education & Program", 20, 130);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Enrolled in Career Coaching Program`, 20, 138);
      if (form.startDate) doc.text(`Program Period: ${form.startDate} to ${form.finishDate || 'Present'}`, 20, 143);

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Generated by Elevate AI Career Assistant", 20, 280);

      const pdfBlob = doc.output('blob');
      const filename = tempResumeName.endsWith('.pdf') ? tempResumeName : `${tempResumeName}.pdf`;
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      await handleResumeUpload(pdfFile);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to generate PDF resume.' });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Compute which fields have changed from the last saved snapshot
  const getDirtyFields = () => {
    if (!savedFormRef.current) return [];
    const labels = {
      firstName: 'First Name', lastName: 'Last Name', phone: 'Phone Number',
      address: 'Address', personnummer: 'Personnummer', bio: 'Professional Summary',
      skills: 'Core Skills', industries: 'Industries', employmentStatus: 'Employment Status',
      startDate: 'Start Date', finishDate: 'Finish Date',
      marketingConsent: 'Marketing Consent', dataConsent: 'Data Consent',
    };
    return Object.entries(labels)
      .filter(([key]) => JSON.stringify(form[key]) !== JSON.stringify(savedFormRef.current[key]))
      .map(([, label]) => label);
  };

  const isDirty = savedFormRef.current
    ? JSON.stringify(form) !== JSON.stringify(savedFormRef.current)
    : true;

  const openSaveModal = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      setStatus({ type: 'error', message: 'Please complete all required personal fields.' });
      return;
    }
    setShowSaveModal(true);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setStatus(null);
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
        setShowSaveModal(false);
        return;
      }

      savedFormRef.current = { ...form };
      setUser({ ...user, ...form });
      setShowSaveModal(false);
      setStatus({ type: 'success', message: 'Profile saved successfully!' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error occurred.' });
      setShowSaveModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  const enhanceProfile = async () => {
    if (!aiPrompt.trim()) {
      setStatus({ type: 'error', message: 'Please provide some details for the AI.' });
      return;
    }

    setAiModalOpen(false);
    setIsAiGenerating(true);
    setLoadingMessage('AI is enhancing your profile with professional suggestions...');
    setStatus(null);

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

      const data = payload.data;
      const newBio = typeof data === 'string' ? data : data.bio;

      setForm((prev) => ({
        ...prev,
        bio: newBio || prev.bio,
        skills: data.skills ? Array.from(new Set([...(prev.skills || []), ...data.skills])) : prev.skills
      }));

      setStatus({ type: 'success', message: 'AI suggestions applied to your bio and skills!' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', message: 'AI enhancement failed.' });
    } finally {
      setIsAiGenerating(false);
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
    <div className="relative max-w-6xl mx-auto px-0 sm:px-0 space-y-5 sm:space-y-8 pb-16 sm:pb-20 animate-in fade-in duration-500 font-['DM_Sans',sans-serif]">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="afterInteractive" />
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
          letter-spacing: 0.2em; display: flex; align-items: center; gap: 10px; margin-bottom: 24px;
        }
        .form-label {
          display: block; font-size: 11px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; padding-left: 4px;
        }
        @media (max-width: 768px) {
          .glass-panel { border-radius: 20px !important; }
        }
        @media (max-width: 640px) {
          .serif { font-size: 2rem !important; }
          .glass-panel { padding: 1.25rem !important; border-radius: 16px !important; }
          .btn-primary, .btn-ai, .btn-outline { width: 100%; font-size: 13px; padding: 11px 16px; }
          .section-title { font-size: 10px; }
          .input-dark { padding: 10px 14px; font-size: 13px; }
          .form-label { font-size: 10px; }
        }
      `}</style>

      {status && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[400] w-[calc(100%-2rem)] sm:w-full max-w-md p-3 sm:p-4 rounded-2xl border flex items-center gap-3 sm:gap-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-8 duration-300 ${status.type === 'error' ? 'bg-rose-500/20 border-rose-500/30 text-rose-200' :
          status.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200' :
            'bg-sky-500/20 border-sky-500/30 text-sky-200'
          }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${status.type === 'error' ? 'bg-rose-500/20' :
            status.type === 'success' ? 'bg-emerald-500/20' :
              'bg-sky-500/20'
            }`}>
            {status.type === 'error' ? <AlertCircle size={20} /> :
              status.type === 'success' ? <CheckCircle2 size={20} /> :
                <Sparkles size={20} />}
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-70">
              {status.type === 'error' ? 'Action Failed' : status.type === 'success' ? 'Success' : 'Notice'}
            </h4>
            <p className="text-sm font-medium">{status.message}</p>
          </div>
          <button onClick={() => setStatus(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X size={16} className="opacity-50" />
          </button>
        </div>
      )}

      <div className="glass-panel p-5 sm:p-8 md:p-10 shadow-2xl shadow-black/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Avatar + Name row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 relative z-10">
          {/* Avatar block */}
          <div className="relative shrink-0 group flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-[24px] sm:rounded-[28px] md:rounded-[32px] overflow-hidden bg-[#0f0e1c] border-2 border-white/10 flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
                    <UserCircle size={44} className="text-indigo-400/50" />
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Video Icon Overlapping Avatar Top Right */}
              {form.videoUrl && !selectedVideo && (
                <button
                  type="button"
                  onClick={() => setPlayingVideo(true)}
                  className="absolute -top-1.5 -right-1.5 z-30 w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.5)] border border-white/20 hover:bg-indigo-500 hover:scale-110 active:scale-95 transition-all group"
                  title="View Intro Video"
                >
                  <Video size={16} className="group-hover:rotate-12 transition-transform" />
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-1.5 w-full max-w-[130px]">
              <label className="text-[10px] font-bold text-center px-3 py-2 rounded-xl border border-white/10 bg-[#1a1b2e]/90 backdrop-blur-md hover:bg-indigo-500/20 hover:border-indigo-500/30 cursor-pointer text-slate-200 transition-all shadow-xl">
                Update Photo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarSelect(e.target.files?.[0])} disabled={isUploading} />
              </label>
              {avatarFile && !isUploading && (
                <button type="button" onClick={confirmAvatarUpload} className="text-[10px] font-bold text-center px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg animate-in zoom-in-95">
                  Confirm Save
                </button>
              )}
            </div>
          </div>

          {/* Name / badges block */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                <ShieldCheck size={11} />
                <span className="whitespace-nowrap">Verified Candidate</span>
              </div>
              {form.coachName && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
                  <Briefcase size={11} />
                  <span className="whitespace-nowrap">Coach: {form.coachName}</span>
                </div>
              )}
            </div>
            <h1 className="serif text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-2 sm:mb-3 font-medium tracking-tight">Your Profile</h1>
            <p className="text-slate-400 font-light text-sm max-w-sm sm:max-w-md">Fine-tune your professional narrative and let coaches see your full potential.</p>
            <div className="mt-4 sm:mt-6 flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3">
              {form.resumeUrl && (
                <a
                  href={form.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-cyan-500/20 hover:border-cyan-500/30 hover:text-cyan-300 transition-all shadow-xl group"
                >
                  <FileText size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                  View Resume
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6 relative z-10">
          <button className="btn-ai w-full sm:w-auto sm:min-w-[160px] h-12 sm:h-14" onClick={() => setAiModalOpen(true)}>
            <Sparkles size={16} /> <span className="whitespace-nowrap">Enhance with AI</span>
          </button>
          <button className="btn-primary w-full sm:w-auto sm:min-w-[160px] h-12 sm:h-14" onClick={openSaveModal}>
            <Save size={16} /> <span className="whitespace-nowrap">Save All Changes</span>
          </button>
        </div>
      </div>

      <section className="glass-panel p-5 sm:p-8 md:p-10 animate-in fade-up duration-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div>
            <h2 className="section-title mb-2"><Sparkles size={16} className="text-emerald-400" /> Professional Summary</h2>
            <p className="text-slate-400 text-base font-light">Craft a compelling story that highlights your unique value proposition.</p>
          </div>
          <button
            type="button"
            onClick={generateSummaryAI}
            disabled={isAiGenerating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {isAiGenerating ? <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /> : <Sparkles size={14} />}
            {isAiGenerating ? 'AI is Writing...' : 'AI Bio Generator'}
          </button>
        </div>

        <div className="relative group">
          <textarea
            className="input-dark min-h-[160px] sm:min-h-[200px] text-sm sm:text-base md:text-lg leading-relaxed p-4 sm:p-6 md:p-8 focus:ring-4 focus:ring-indigo-500/10"
            placeholder="Introduce yourself to the world..."
            value={form.bio}
            onChange={(e) => updateField('bio', e.target.value)}
          />
          <div className="absolute bottom-6 right-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-[#0a0b16]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
            {form.bio?.length || 0} / 1000 characters
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <section className="glass-panel p-5 sm:p-8">
          <h2 className="section-title"><UserCircle size={14} className="text-indigo-400" /> Personal Information</h2>
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

        <section className="glass-panel p-5 sm:p-8">
          <h2 className="section-title"><Briefcase size={14} className="text-indigo-400" /> Program Information</h2>
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

        <section className="glass-panel p-5 sm:p-8">
          <h2 className="section-title"><Briefcase size={14} className="text-indigo-400" /> Professional Details</h2>
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

        <section className="glass-panel p-5 sm:p-8">
          <h2 className="section-title"><Video size={14} className="text-indigo-400" /> Video Introduction</h2>
          <div className="space-y-6">
            <p className="text-sm font-light text-slate-400 leading-relaxed">
              Upload or record a short 1-2 minute video introducing yourself to potential employers. This greatly increases your chances of standing out.
            </p>

            <div className="flex flex-wrap gap-3">
              <label className="btn-outline cursor-pointer border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-500/50">
                Choose Video
                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0])} disabled={isUploading} />
              </label>
              <button type="button" className="btn-outline" onClick={startWebcam} disabled={isUploading}>
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

        <section className="glass-panel p-5 sm:p-8 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-5 sm:mb-8">
            <div>
              <h2 className="section-title mb-1"><FileText size={14} className="text-indigo-400" /> Resume & Professional Documents</h2>
              <p className="text-slate-400 text-sm font-light">Upload your existing resume or let Elevate AI generate one for you.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => resumeFileRef.current?.click()}
                disabled={isUploading}
                className="btn-outline w-full sm:w-auto"
              >
                <Upload size={16} /> Upload Resume
                <input
                  type="file"
                  ref={resumeFileRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleResumeUpload(e.target.files?.[0])}
                />
              </button>
              <button
                type="button"
                onClick={generateResumeAI}
                disabled={isUploading}
                className="btn-ai w-full sm:w-auto"
              >
                <Sparkles size={16} /> Generate with AI
              </button>
            </div>
          </div>

          {form.resumeUrl ? (
            <div className="p-4 sm:p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-bold text-sm truncate">{form.resumeName || 'Professional Resume'}</h4>
                    <p className="text-slate-400 text-xs">Last updated {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewResumeUrl(form.resumeUrl);
                      setShowResumePreview(true);
                    }}
                    className="px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => updateField('resumeUrl', '')}
                    className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-12 flex flex-col items-center justify-center text-slate-500 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <FileText size={32} className="opacity-50" />
              </div>
              <h4 className="text-white font-bold mb-1">No resume found</h4>
              <p className="text-xs max-w-xs">Upload your own or use our AI assistant to generate a professional PDF in seconds.</p>
            </div>
          )}
        </section>

        <section className="glass-panel p-5 sm:p-8 lg:col-span-2">
          <h2 className="section-title"><ShieldCheck size={14} className="text-indigo-400" /> Legal & Privacy</h2>
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

      {aiModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f0e1c] border border-emerald-500/20 shadow-[0_24px_50px_rgba(0,0,0,0.6)] rounded-3xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 relative">
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
                <X size={16} />
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
              <button className="btn-outline !w-auto" onClick={() => setAiModalOpen(false)}>Cancel</button>
              <button className="btn-ai !w-auto" onClick={enhanceProfile}>Generate with AI</button>
            </div>
          </div>
        </div>
      )}

      {showRecorder && (
        <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#0d0c1e] border border-white/10 shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'}`} />
                <h3 className="text-lg font-bold text-white serif">Video Recorder</h3>
              </div>
              <button onClick={stopWebcam} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
            </div>

            <div className="aspect-video bg-black relative">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />

              {isRecording && (
                <div className="absolute top-6 right-6 px-4 py-2 rounded-full bg-black/60 border border-rose-500/30 backdrop-blur-md flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-sm font-black text-white tabular-nums">{formatTime(recordingTime)}</span>
                </div>
              )}
            </div>

            <div className="p-8 flex flex-col items-center gap-6">
              <p className="text-slate-400 text-xs font-medium text-center max-w-sm">
                Position yourself in the center. Ensure good lighting and a quiet background.
              </p>

              <div className="flex items-center gap-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                  >
                    <div className="w-6 h-6 rounded-full bg-white" />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  >
                    <div className="w-6 h-6 rounded-sm bg-rose-600" />
                  </button>
                )}
              </div>

              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {isRecording ? 'Click to Stop Recording' : 'Click to Start Recording'}
              </span>
            </div>
          </div>
          <style>{`.mirror { transform: scaleX(-1); }`}</style>
        </div>
      )}

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
                <X size={20} />
              </button>
            </div>
            <video src={form.videoUrl} controls autoPlay className="w-full h-auto aspect-video object-contain" />
          </div>
        </div>
      )}

      {isAiGenerating && (
        <div className="fixed inset-0 z-[300] bg-[#06060f]/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="glass-panel max-w-sm w-full p-10 flex flex-col items-center text-center shadow-2xl shadow-indigo-500/10 border-indigo-500/20 animate-in zoom-in-95 duration-300">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles size={40} className="animate-pulse" />
              </div>
            </div>
            <h3 className="serif text-xl text-white mb-3">AI Assistant Working</h3>
            <p className="text-slate-400 text-sm font-light leading-relaxed mb-6">
              {loadingMessage || 'Please wait while our AI assistant processes your request...'}
            </p>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
            </div>
            <style>{`
              @keyframes loading {
                0% { transform: translateX(-100%); width: 30%; }
                50% { transform: translateX(100%); width: 60%; }
                100% { transform: translateX(250%); width: 30%; }
              }
            `}</style>
          </div>
        </div>
      )}

      {showResumeNamePrompt && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <h3 className="serif text-2xl text-white mb-2">Name Your Resume</h3>
            <p className="text-slate-400 text-sm mb-6 font-light">Give your generated resume a descriptive name to help you keep track of different versions.</p>

            <div className="space-y-4">
              <div>
                <label className="form-label">Resume Name</label>
                <input
                  className="input-dark"
                  placeholder="e.g. Software_Engineer_Resume"
                  value={tempResumeName}
                  onChange={(e) => setTempResumeName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowResumeNamePrompt(false)} className="btn-outline flex-1">Cancel</button>
                <button onClick={confirmGenerateResumeAI} className="btn-ai flex-1">Generate PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResumePreview && previewResumeUrl && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="relative w-full max-w-5xl h-[90vh] bg-[#0f0e1c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{form.resumeName || 'Resume Preview'}</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Document Viewer</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewResumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 px-3"
                >
                  <Upload size={16} className="rotate-90" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Open Original</span>
                </a>
                <button
                  onClick={() => setShowResumePreview(false)}
                  className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-[#1a192d]">
              <iframe
                src={`/api/proxy/pdf?url=${encodeURIComponent(previewResumeUrl)}`}
                className="w-full h-full border-none bg-white"
                title="Resume Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Save Confirmation Modal ── */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f0e1c] border border-indigo-500/20 shadow-[0_32px_64px_rgba(0,0,0,0.7)] rounded-3xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative">
            {/* Glow */}
            <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-500/15 blur-[60px] pointer-events-none rounded-full" />

            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01] relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Save size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Save Profile Changes</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Review before saving</p>
                </div>
              </div>
              <button
                onClick={() => setShowSaveModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Changed fields list */}
            <div className="p-6 relative z-10">
              {(() => {
                const dirty = getDirtyFields();
                return dirty.length > 0 ? (
                  <div className="mb-5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      {dirty.length} field{dirty.length > 1 ? 's' : ''} changed
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {dirty.map(f => (
                        <span key={f} className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-bold">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-5 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-slate-400 text-sm">Saving your current profile state.</p>
                  </div>
                );
              })()}

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-amber-400 text-[10px] font-black">!</span>
                </div>
                <p className="text-amber-200/70 text-xs font-light leading-relaxed">
                  This will overwrite your saved profile data. Make sure all information is correct before proceeding.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 border-t border-white/5 bg-white/[0.01] flex gap-3 relative z-10">
              <button
                onClick={() => setShowSaveModal(false)}
                disabled={isSaving}
                className="btn-outline flex-1 !h-12 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={isSaving}
                className="btn-primary flex-1 !h-12 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={15} /> Confirm Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
