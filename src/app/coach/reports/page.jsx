'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import apiService from '@/services/api';

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole } = useAuth();
  const [authToken] = useLocalStorage('token', '');
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Coach')) {
      router.push('/login');
      return;
    }

    const fetchCandidates = async () => {
      try {
        const data = await apiService.coach.getActiveCandidates();
        setCandidates(data.data || []);
      } catch (err) {
        console.error('Candidates error:', err);
        if (err.message === 'Unauthorized') {
          router.push('/login');
          return;
        }
        setError('Failed to load candidates');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [isAuthenticated, hasRole, authToken, router]);

  const handleGenerateReport = async (e) => {
    e.preventDefault();

    if (!selectedCandidate || !startDate || !endDate) {
      setError('Please select all fields');
      return;
    }

    setGeneratingReport(true);
    setError('');

    try {
      const data = await apiService.coach.getReports(selectedCandidate, startDate, endDate);
      setReport(data.report);
    } catch (err) {
      console.error('Report generation error:', err);
      setError('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleExportCSV = () => {
    if (!report) return;

    const headers = ['Date', 'Type', 'Duration (min)', 'Notes'];
    const rows = report.sessionHistory.map((session) => [
      session.date,
      session.type,
      session.duration,
      session.notes || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${selectedCandidate}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filter Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Generate Report</h2>
          <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Candidate</label>
              <select
                required
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">-- Select candidate --</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={generatingReport}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
              >
                {generatingReport ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </form>
        </div>

        {/* Report Display */}
        {report && (
          <div className="space-y-6">
            {/* Report Header */}
            <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{report.candidateName}</h2>
                <p className="text-gray-600 mt-1">
                  Report Period: {report.startDate} to {report.endDate}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Note: This report can be shared with government agency
                </p>
              </div>
              <button
                onClick={handleExportCSV}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                📥 Export CSV
              </button>
            </div>

            {/* Progress Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Attendance %</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{report.attendance || 0}%</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Assignments Completed %</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{report.assignmentsCompleted || 0}%</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Overall Progress %</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{report.overallProgress || 0}%</p>
              </div>
            </div>

            {/* Session History */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Session History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Duration (min)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.sessionHistory.map((session, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-900">{session.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{session.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{session.duration}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{session.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Document Submissions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Document Submissions</h3>
              <p className="text-gray-700 mb-4">{report.documentSubmissions || 'No documents submitted'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
