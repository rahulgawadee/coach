'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';

export default function CompanyInfoPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole } = useAuth();
  const [authToken] = useLocalStorage('token', '');
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Coach')) {
      router.push('/coach/login');
      return;
    }

    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch('/api/coach/company-info', {
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
          setCompanyInfo(data.company);
        } else {
          setError(data.error || 'Failed to load company info');
        }
      } catch (err) {
        console.error('Company info error:', err);
        setError('Failed to load company information');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [isAuthenticated, hasRole, authToken, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading company information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Company Information</h1>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition">
            Request Edit
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {companyInfo ? (
          <div className="space-y-6">
            {/* Company Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Company Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Company Name</p>
                  <p className="text-lg font-semibold text-gray-900 mt-2">{companyInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registration Number</p>
                  <p className="text-lg font-semibold text-gray-900 mt-2">{companyInfo.registrationNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Government Agency ID</p>
                  <p className="text-lg font-semibold text-gray-900 mt-2">{companyInfo.governmentAgencyId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact Person</p>
                  <p className="text-lg font-semibold text-gray-900 mt-2">{companyInfo.contactPerson}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-semibold text-gray-900 mt-2">{companyInfo.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-lg font-semibold text-gray-900 mt-2">{companyInfo.phone}</p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="text-3xl font-bold text-yellow-500 mt-2">{companyInfo.rating} ★</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{companyInfo.successRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Candidates</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{companyInfo.activeCandidates || 0}</p>
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Testimonials from Candidates</h2>
              <div className="space-y-4">
                {companyInfo.testimonials && companyInfo.testimonials.length > 0 ? (
                  companyInfo.testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="text-gray-700">{testimonial.text}</p>
                      <p className="text-sm text-gray-600 mt-2">— {testimonial.candidateName}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No testimonials yet</p>
                )}
              </div>
            </div>

            {/* Coaches List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Coaches at This Company</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assigned Candidates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {companyInfo.coaches && companyInfo.coaches.length > 0 ? (
                      companyInfo.coaches.map((coach) => (
                        <tr key={coach.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{coach.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{coach.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{coach.assignedCandidates}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          No coaches listed
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">Company information not available</p>
          </div>
        )}
      </div>
    </div>
  );
}
