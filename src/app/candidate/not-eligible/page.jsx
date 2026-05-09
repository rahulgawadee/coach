'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function NotEligiblePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [prefill, setPrefill] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/candidate/eligibility-check');
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setReason(data?.reason || data?.message || 'No specific reason provided.');
        if (data?.formData) setPrefill(data.formData);
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 to-red-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-orange-100 rounded-full mb-6">
            <svg
              className="w-12 h-12 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Currently Not Eligible</h1>
          <p className="text-lg text-gray-600">You are not currently eligible for Rusta och matcha program</p>
        </div>

        {/* Main Message Card */}
        <Card className="mb-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">What does this mean?</h2>
              <p className="text-gray-700 leading-relaxed">
                Based on the information you provided and our eligibility check with the Swedish
                Employment Agency (Arbetsförmedlingen), you do not currently meet the requirements
                for the Rusta och matcha program.
              </p>
              {loading ? (
                <p className="text-gray-600 mt-2">Checking details...</p>
              ) : (
                <p className="text-gray-700 mt-2">Reason: <span className="font-medium">{reason}</span></p>
              )}
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-orange-600 font-bold mt-1">•</span>
                  <span className="text-gray-700">Registered with the Swedish Employment Agency (Arbetsförmedlingen)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-600 font-bold mt-1">•</span>
                  <span className="text-gray-700">Eligible for the Rusta och matcha program specifically</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-600 font-bold mt-1">•</span>
                  <span className="text-gray-700">Currently looking for employment or training opportunities</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Next Steps</h3>
              <p className="text-gray-700 mb-3">
                We recommend contacting the Swedish Employment Agency directly to learn more about
                your eligibility status and what programs may be available to you.
              </p>
              {reason && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-100 rounded">
                  <p className="text-sm text-yellow-800">Specific reason: {reason}</p>
                </div>
              )}
              <a
                href="https://www.arbetsformedlingen.se/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mt-3"
              >
                Visit Arbetsförmedlingen
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Check Back Later
              </h3>
              <p className="text-gray-700 text-sm">
                Your eligibility status may change. You can return to this form later to check if
                your situation has changed or if you've become eligible for the program.
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Return Home
            </Button>
          </Link>
          <Link href="/candidate/step1">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Recheck Eligibility
            </Button>
          </Link>
          {prefill && (
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => {
                try {
                  localStorage.setItem('candidate_prefill', JSON.stringify(prefill));
                } catch (e) {}
                router.push('/candidate/step1');
              }}
            >
              Retry with my data
            </Button>
          )}
        </div>

        {/* Support Section */}
        <div className="mt-12 p-6 bg-white rounded-lg border border-gray-200 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            If you believe you should be eligible or have questions about your eligibility status,
            please contact Arbetsförmedlingen directly.
          </p>
          <p className="text-sm text-gray-500">
            Email:{' '}
            <a href="mailto:arbetsformedlingen@arbetsformedlingen.se" className="text-blue-600 hover:text-blue-700">
              arbetsformedlingen@arbetsformedlingen.se
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
