"use client";
import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../../../../src/components/layout/Sidebar';
import Navbar from '../../../../src/components/layout/Navbar';
import useLocalStorage from '../../../../src/hooks/useLocalStorage';

const INDUSTRIES = ['IT', 'Healthcare', 'Construction', 'Finance', 'Education', 'Other'];

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
    industries: [],
    skills: [],
    employmentStatus: 'Unemployed',
    marketingConsent: false,
    dataConsent: false,
  });
  const [status, setStatus] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        email: user.email || '',
        firstName: user.firstName || user.name?.split?.(' ')?.[0] || '',
        lastName: user.lastName || user.name?.split?.(' ')?.slice(1).join(' ') || '',
        coachName: user.coachName || '',
        companyName: user.companyName || '',
      }));
    }
  }, [user]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveProfile = async () => {
    setStatus(null);

    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      setStatus({ type: 'error', message: 'Please complete the required fields.' });
      return;
    }

    const response = await fetch('/api/candidate/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const payload = await response.json();
    if (!payload.success) {
      setStatus({ type: 'error', message: payload.error || 'Failed to save profile' });
      return;
    }

    setUser({ ...user, ...form });
    setStatus({ type: 'success', message: 'Profile saved successfully' });
  };

  const enhanceProfile = async () => {
    setStatus({ type: 'info', message: 'Enhancing profile with AI...' });
    const response = await fetch('/api/ai/profile-enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: form }),
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
    setStatus({ type: 'success', message: 'AI suggestions applied' });
  };

  const onVideoUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateField('videoUrl', reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="candidate" />
      <div className="flex">
        <Sidebar role="candidate" />
        <main className="flex-1 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Profile</h1>

          {status && (
            <div
              className={`mt-4 rounded border px-4 py-3 text-sm ${
                status.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : status.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-blue-200 bg-blue-50 text-blue-700'
              }`}
            >
              {status.message}
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input className="rounded-lg border border-gray-200 px-3 py-2" placeholder="First Name" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
                <input className="rounded-lg border border-gray-200 px-3 py-2" placeholder="Last Name" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
                <input className="rounded-lg border border-gray-200 px-3 py-2 md:col-span-2" placeholder="Email" value={form.email} readOnly />
                <input className="rounded-lg border border-gray-200 px-3 py-2" placeholder="Phone" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
                <input className="rounded-lg border border-gray-200 px-3 py-2" placeholder="Address" value={form.address} onChange={(e) => updateField('address', e.target.value)} />
                <input className="rounded-lg border border-gray-200 px-3 py-2 md:col-span-2" placeholder="Key Person Number (Personnummer)" value={form.personnummer} onChange={(e) => updateField('personnummer', e.target.value)} />
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Program Information</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-gray-600">Start Date</label>
                  <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2" value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">Finish Date</label>
                  <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2" value={form.finishDate} onChange={(e) => updateField('finishDate', e.target.value)} />
                </div>
                <input className="rounded-lg border border-gray-200 px-3 py-2" value={form.coachName} readOnly placeholder="Coach Name" />
                <input className="rounded-lg border border-gray-200 px-3 py-2" value={form.companyName} readOnly placeholder="Company Name" />
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Video Profile</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  Upload Video
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => onVideoUpload(e.target.files?.[0])} />
                </label>
                <button type="button" className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50" onClick={() => fileRef.current?.click()}>
                  Record from Webcam
                </button>
                {form.videoUrl && (
                  <button type="button" className="rounded-lg border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50" onClick={() => updateField('videoUrl', '')}>
                    Delete
                  </button>
                )}
              </div>
              {form.videoUrl && <video className="mt-4 w-full rounded-lg border border-gray-200" controls src={form.videoUrl} />}
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Professional</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Industrial Fields</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {INDUSTRIES.map((industry) => (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => {
                          const set = new Set(form.industries || []);
                          if (set.has(industry)) set.delete(industry);
                          else set.add(industry);
                          updateField('industries', Array.from(set));
                        }}
                        className={`rounded-full border px-3 py-1 text-sm ${
                          (form.industries || []).includes(industry)
                            ? 'border-blue-300 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700'
                        }`}
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Skills</label>
                  <input
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2"
                    placeholder="Comma separated skills"
                    value={(form.skills || []).join(', ')}
                    onChange={(e) => updateField('skills', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Employment Status</label>
                  <select className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2" value={form.employmentStatus} onChange={(e) => updateField('employmentStatus', e.target.value)}>
                    <option>Employed</option>
                    <option>Unemployed</option>
                    <option>Student</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900">Consents</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
                  <input type="checkbox" checked={form.marketingConsent} onChange={(e) => updateField('marketingConsent', e.target.checked)} />
                  <span>Marketing Consent</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
                  <input type="checkbox" checked={form.dataConsent} onChange={(e) => updateField('dataConsent', e.target.checked)} />
                  <span>Data Processing Consent</span>
                </label>
              </div>
            </section>

            <section className="flex gap-3 lg:col-span-2">
              <button type="button" className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700" onClick={saveProfile}>
                Save Changes
              </button>
              <button type="button" className="rounded-lg bg-green-600 px-5 py-3 text-white hover:bg-green-700" onClick={enhanceProfile}>
                Enhance Profile
              </button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
