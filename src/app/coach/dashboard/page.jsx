'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import apiService from '@/services/api';
import SafeDate from '@/components/ui/SafeDate';

export default function CoachDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeCandidates, setActiveCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (!storedUser) {
      router.push('/login');
    }
  }, []);

  // Load pending requests and active candidates
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [pendingRes, activeCandidatesRes] = await Promise.all([
          apiService.coach.getPendingRequests(),
          apiService.coach.getActiveCandidates(),
        ]);

        if (pendingRes.success) {
          setPendingRequests(pendingRes.requests || []);
        }

        if (activeCandidatesRes.success) {
          setActiveCandidates(activeCandidatesRes.candidates || []);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Poll for updates every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAccept = async (assignmentId) => {
    try {
      setActionLoading(true);
      const response = await apiService.coach.acceptCandidate(assignmentId);

      if (response.success) {
        // Remove from pending and reload data
        setPendingRequests(pendingRequests.filter((r) => r.assignmentId !== assignmentId));
        // Reload active candidates
        const activeCandidatesRes = await apiService.coach.getActiveCandidates();
        if (activeCandidatesRes.success) {
          setActiveCandidates(activeCandidatesRes.candidates || []);
        }
        setShowRequestModal(false);
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error accepting candidate:', error);
      alert('Failed to accept candidate. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async (assignmentId) => {
    try {
      setActionLoading(true);
      const reason = prompt('Please provide a reason for declining (optional):');
      const response = await apiService.coach.declineCandidate(assignmentId, reason);

      if (response.success) {
        // Remove from pending
        setPendingRequests(pendingRequests.filter((r) => r.assignmentId !== assignmentId));
        setShowRequestModal(false);
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error declining candidate:', error);
      alert('Failed to decline candidate. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome Coach, {user.name}!</h1>
              <p className="text-gray-600 mt-1">Manage your mentorship activities</p>
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                } catch (error) {
                  console.error('Logout API call failed:', error);
                } finally {
                  localStorage.removeItem('user');
                  localStorage.removeItem('token');
                  localStorage.removeItem('candidateProfile');
                  setUser(null);
                  router.push('/login');
                }
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Pending Requests Notification */}
        {pendingRequests.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-6 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">📢</span>
                  <h3 className="text-lg font-bold text-gray-900">New Candidate Requests!</h3>
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
                    {pendingRequests.length}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  You have {pendingRequests.length} new {pendingRequests.length === 1 ? 'request' : 'requests'} waiting for your review.
                </p>
              </div>
            </div>

            {/* Pending Requests List */}
            <div className="mt-4 space-y-3">
              {pendingRequests.slice(0, 3).map((request) => (
                <div key={request.assignmentId} className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{request.candidateName}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>💼 {request.profile?.occupation || 'Unknown'}</span>
                      <span>📍 {request.profile?.location || 'Unknown'}</span>
                      <span>⭐ Match: {request.matchScore}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRequestModal(true);
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {pendingRequests.length > 3 && (
              <p className="text-sm text-gray-600 mt-3 pl-4 border-l-2 border-gray-300">
                +{pendingRequests.length - 3} more requests pending
              </p>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Active Mentees */}
          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{activeCandidates.length}</div>
              <p className="text-gray-600">Active Candidates</p>
              <p className="text-xs text-gray-500 mt-1">
                {activeCandidates.length > 0
                  ? `${activeCandidates.length}/${activeCandidates[0]?.capacity?.max || '?'}`
                  : 'None yet'}
              </p>
              <Button variant="primary" size="sm" className="w-full mt-4">
                View All
              </Button>
            </div>
          </Card>

          {/* Pending Requests */}
          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">{pendingRequests.length}</div>
              <p className="text-gray-600">Pending Requests</p>
              <p className="text-xs text-gray-500 mt-1">Needs your review</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => {
                  if (pendingRequests.length > 0) {
                    setSelectedRequest(pendingRequests[0]);
                    setShowRequestModal(true);
                  }
                }}
              >
                Review
              </Button>
            </div>
          </Card>

          {/* Messages */}
          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">0</div>
              <p className="text-gray-600">Unread Messages</p>
              <Button variant="outline" size="sm" className="w-full mt-4">
                Read
              </Button>
            </div>
          </Card>

          {/* Completion Rate */}
          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {activeCandidates.length > 0
                  ? Math.round(activeCandidates.reduce((acc, c) => acc + c.progress, 0) / activeCandidates.length)
                  : 0}
                %
              </div>
              <p className="text-gray-600">Avg Progress</p>
              <Button variant="outline" size="sm" className="w-full mt-4">
                Details
              </Button>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card header="Quick Actions">
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/coach/candidates')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
            >
              <div className="text-2xl mb-2">👥</div>
              <p className="font-semibold text-gray-900">My Candidates</p>
              <p className="text-sm text-gray-600">View and manage your candidates</p>
            </button>

            <button
              onClick={() => router.push('/coach/schedule')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
            >
              <div className="text-2xl mb-2">📅</div>
              <p className="font-semibold text-gray-900">Schedule Meeting</p>
              <p className="text-sm text-gray-600">Set up mentorship sessions</p>
            </button>

            <button
              onClick={() => router.push('/coach/messages')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
            >
              <div className="text-2xl mb-2">💬</div>
              <p className="font-semibold text-gray-900">Messages</p>
              <p className="text-sm text-gray-600">Communicate with candidates</p>
            </button>
          </div>
        </Card>

        {/* Active Candidates */}
        {activeCandidates.length > 0 && (
          <Card header="Your Active Candidates" className="mt-8">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Session
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeCandidates.slice(0, 5).map((candidate) => (
                    <tr key={candidate.candidateId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {candidate.candidateName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <SafeDate date={candidate.startDate} format="toLocaleDateString" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${candidate.progress}%` }}
                            />
                          </div>
                          <span>{candidate.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {candidate.nextSession ? <SafeDate date={candidate.nextSession} format="toLocaleDateString" /> : 'Not scheduled'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">Message</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Request Detail Modal */}
      {showRequestModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Candidate Request</h2>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Candidate Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedRequest.candidateName}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedRequest.candidateEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Match Score</p>
                    <p className="font-medium text-gray-900">{selectedRequest.matchScore}%</p>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              {selectedRequest.profile && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Occupation</p>
                    <p className="text-gray-900">{selectedRequest.profile.occupation}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Location</p>
                    <p className="text-gray-900">{selectedRequest.profile.location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Experience</p>
                    <p className="text-gray-900">{selectedRequest.profile.experience} years</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Skills</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedRequest.profile.skills?.map((skill) => (
                        <span key={skill} className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedRequest.profile.about && (
                    <div>
                      <p className="text-sm font-semibold text-gray-600">About</p>
                      <p className="text-gray-900">{selectedRequest.profile.about}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  disabled={actionLoading}
                  onClick={() => handleAccept(selectedRequest.assignmentId)}
                >
                  {actionLoading ? 'Processing...' : '✓ Accept Candidate'}
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="flex-1"
                  disabled={actionLoading}
                  onClick={() => handleDecline(selectedRequest.assignmentId)}
                >
                  {actionLoading ? 'Processing...' : '✕ Decline'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
