'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import apiService from '@/services/api';
import SafeDate from '@/components/ui/SafeDate';
import Modal from '@/components/ui/Modal';

export default function CoachDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeCandidates, setActiveCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [coach, setCoach] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    if (!storedUser) router.push('/login');
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      const [pendingRes, activeCandidatesRes] = await Promise.all([
        apiService.coach.getPendingRequests(),
        apiService.coach.getActiveCandidates(),
      ]);

      if (pendingRes.success) {
        setPendingRequests(pendingRes.requests || []);
        // Auto-select first request if none selected
        if (pendingRes.requests?.length > 0 && !selectedRequest) {
          setSelectedRequest(pendingRes.requests[0]);
        }
      }
      if (activeCandidatesRes.success) setActiveCandidates(activeCandidatesRes.candidates || []);

      const coachProfileRes = await apiService.coach.getProfile();
      if (coachProfileRes.success) setCoach(coachProfileRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAccept = async (assignmentId) => {
    try {
      setActionLoading(true);
      const response = await apiService.coach.acceptCandidate(assignmentId);
      if (response.success) {
        const remaining = pendingRequests.filter(r => r.assignmentId !== assignmentId);
        setPendingRequests(remaining);
        if (remaining.length > 0) {
          setSelectedRequest(remaining[0]);
        } else {
          setShowRequestModal(false);
          setSelectedRequest(null);
        }
        loadData();
      }
    } catch (error) {
      alert('Failed to accept candidate.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async (assignmentId) => {
    const reason = prompt('Please provide a reason for declining (optional):');
    try {
      setActionLoading(true);
      const response = await apiService.coach.declineCandidate(assignmentId, reason);
      if (response.success) {
        const remaining = pendingRequests.filter(r => r.assignmentId !== assignmentId);
        setPendingRequests(remaining);
        if (remaining.length > 0) {
          setSelectedRequest(remaining[0]);
        } else {
          setShowRequestModal(false);
          setSelectedRequest(null);
        }
        loadData();
      }
    } catch (error) {
      alert('Failed to decline candidate.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Premium Header */}
      <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Coach Dashboard</h1>
          <p className="text-slate-500 mt-1">Hello, <span className="text-blue-600 font-bold">{user.name}</span>. You have {activeCandidates.length} active mentees.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/coach/profile')}>Edit Profile</Button>
          <Button variant="primary" onClick={() => router.push('/coach/schedule')}>My Schedule</Button>
        </div>
      </div>

      {/* Pending Requests Banner */}
      {pendingRequests.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/30">Action Required</span>
              </div>
              <h2 className="text-3xl font-black">{pendingRequests.length} New Candidate {pendingRequests.length === 1 ? 'Request' : 'Requests'}</h2>
              <p className="text-blue-100 text-lg">Potential matches are waiting for your response.</p>
            </div>
            <Button 
              className="bg-white text-blue-700 hover:bg-blue-50 px-10 py-4 font-black rounded-2xl shadow-xl transition-all hover:scale-105"
              onClick={() => {
                if (pendingRequests.length > 0 && !selectedRequest) {
                  setSelectedRequest(pendingRequests[0]);
                }
                setShowRequestModal(true);
              }}
            >
              Review Requests →
            </Button>
          </div>
          {/* Abstract backgrounds */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Mentees', value: activeCandidates.length, icon: '👥', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending', value: pendingRequests.length, icon: '⏳', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Messages', value: 0, icon: '💬', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Success Rate', value: '94%', icon: '📈', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(stat => (
          <Card key={stat.label} className="p-6 border-none shadow-lg shadow-slate-100 transition-transform hover:-translate-y-1">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center text-2xl shadow-inner`}>
                {stat.icon}
              </div>
              <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900">Current Candidates</h3>
              <Link href="/coach/candidates" className="text-xs font-bold text-blue-600 uppercase tracking-widest">View Directory</Link>
            </div>
            
            <div className="space-y-4">
              {activeCandidates.length > 0 ? (
                activeCandidates.map((c) => (
                  <div key={c.candidateId} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black">
                        {c.candidateName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{c.candidateName}</p>
                        <p className="text-xs text-slate-400 font-medium">Started: {new Date(c.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden md:block text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">Progress</p>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.progress}%` }} />
                          </div>
                          <span className="text-xs font-black text-slate-700">{c.progress}%</span>
                        </div>
                      </div>
                      <Button variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">Open</Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                  <p className="text-slate-400 font-medium">No candidates assigned yet.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-black text-slate-900 mb-6">Quick Tools</h3>
            <div className="grid gap-4">
              {[
                { label: 'Broadcast Message', icon: '📢', color: 'bg-indigo-50 text-indigo-600' },
                { label: 'Upload Templates', icon: '📁', color: 'bg-amber-50 text-amber-600' },
                { label: 'Review Reports', icon: '📄', color: 'bg-emerald-50 text-emerald-600' },
              ].map(tool => (
                <button key={tool.label} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-lg transition-all group">
                  <span className={`w-10 h-10 ${tool.color} rounded-xl flex items-center justify-center text-lg`}>{tool.icon}</span>
                  <span className="font-bold text-slate-700 text-sm group-hover:text-blue-600 transition-colors">{tool.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Candidate Profile Modal (Review Request) - MASTER-DETAIL VIEW */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title={`Review Pending Requests (${pendingRequests.length})`}
        size="6xl"
      >
        <div className="flex flex-col md:flex-row gap-0 h-[70vh] -mx-6 -mb-6">
          {/* Master: List of Candidates */}
          <div className="w-full md:w-80 border-r border-slate-100 bg-slate-50 overflow-y-auto">
            <div className="p-4 space-y-3">
              {pendingRequests.map((request) => (
                <button
                  key={request.assignmentId}
                  onClick={() => setSelectedRequest(request)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border-2 ${
                    selectedRequest?.assignmentId === request.assignmentId
                      ? 'bg-white border-blue-600 shadow-lg shadow-blue-100 z-10'
                      : 'bg-transparent border-transparent hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                      selectedRequest?.assignmentId === request.assignmentId ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {request.candidateName.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className={`font-bold truncate ${selectedRequest?.assignmentId === request.assignmentId ? 'text-slate-900' : 'text-slate-700'}`}>
                        {request.candidateName}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Match: {request.matchScore}%
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail: Summary Card & Actions */}
          <div className="flex-1 overflow-y-auto bg-white p-8">
            {selectedRequest ? (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                {/* Header Summary */}
                <div className="flex items-start justify-between gap-6 pb-6 border-b border-slate-50">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-900">{selectedRequest.candidateName}</h2>
                    <div className="flex flex-wrap gap-3">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-lg uppercase tracking-widest border border-blue-100">
                        {selectedRequest.profile?.occupation || 'Candidate'}
                      </span>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-lg uppercase tracking-widest border border-emerald-100">
                        Match Score: {selectedRequest.matchScore}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested On</p>
                    <p className="text-sm font-bold text-slate-700"><SafeDate date={selectedRequest.requestedAt} /></p>
                  </div>
                </div>

                {/* Profile Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Education</p>
                    <p className="text-sm font-bold text-slate-900">{selectedRequest.profile?.education || 'Not Specified'}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Experience</p>
                    <p className="text-sm font-bold text-slate-900">{selectedRequest.profile?.experience} Years</p>
                  </div>
                </div>

                {/* About Section */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Professional Summary</h4>
                  <p className="text-slate-600 leading-relaxed italic bg-blue-50/30 p-5 rounded-2xl border border-blue-50">
                    "{selectedRequest.profile?.about || 'No summary provided by candidate.'}"
                  </p>
                </div>

                {/* Skills Section */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Top Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedRequest.profile?.skills || []).map(skill => (
                      <span key={skill} className="px-3 py-1 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Match Insight */}
                <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 flex items-start gap-4">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Match Insight</h4>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      This candidate is looking for roles in <span className="font-bold">{selectedRequest.profile?.industryPreferences?.[0] || 'your field'}</span>. Your expertise in <span className="font-bold">{coach?.expertiseAreas?.[0] || 'Mentorship'}</span> makes you a perfect fit.
                    </p>
                  </div>
                </div>

                {/* Sticky Actions Container */}
                <div className="sticky bottom-0 pt-6 mt-12 bg-white flex gap-4">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="flex-1 py-5 rounded-2xl font-black shadow-xl shadow-blue-200"
                    onClick={() => handleAccept(selectedRequest.assignmentId)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : '✓ Accept Candidate'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="flex-1 py-5 rounded-2xl font-black text-red-600 border-red-100 hover:bg-red-50"
                    onClick={() => handleDecline(selectedRequest.assignmentId)}
                    disabled={actionLoading}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl">
                  👋
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Select a Candidate</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">Click on a name from the list on the left to review their profile details.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
