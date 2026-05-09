'use client';

import { useState, useCallback } from 'react';
import { ai } from '@/services/api';

/**
 * Custom hook for AI operations with loading/error/success states
 */
export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const resetState = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  /**
   * Validate form answers using AI
   */
  const useFormValidation = useCallback(async (formAnswers) => {
    setLoading(true);
    resetState();

    try {
      const result = await ai.validateFormAnswers(formAnswers);
      setSuccess('Form validation completed');
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Form validation error:', err);
      setError(err.message || 'Failed to validate form');
      setLoading(false);
      throw err;
    }
  }, [resetState]);

  /**
   * Get AI suggestions for skills based on candidate background
   */
  const useCompanyMatching = useCallback(async (candidateProfile, companies) => {
    setLoading(true);
    resetState();

    try {
      const result = await ai.getCompanyMatches(candidateProfile, companies);
      setSuccess('Company matching completed');
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Company matching error:', err);
      setError(err.message || 'Failed to match companies');
      setLoading(false);
      throw err;
    }
  }, [resetState]);

  /**
   * Enhance candidate profile using AI
   */
  const useProfileEnhancement = useCallback(async (profileData) => {
    setLoading(true);
    resetState();

    try {
      const result = await ai.enhanceProfile(profileData);
      setSuccess('Profile enhanced successfully');
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Profile enhancement error:', err);
      setError(err.message || 'Failed to enhance profile');
      setLoading(false);
      throw err;
    }
  }, [resetState]);

  /**
   * Get AI suggestions for meeting times
   */
  const useCalendarSuggestions = useCallback(async (candidateAvailability, coachSchedule) => {
    setLoading(true);
    resetState();

    try {
      const result = await ai.suggestMeetingTimes(candidateAvailability, coachSchedule);
      setSuccess('Calendar suggestions generated');
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Calendar suggestions error:', err);
      setError(err.message || 'Failed to generate suggestions');
      setLoading(false);
      throw err;
    }
  }, [resetState]);

  /**
   * Summarize candidate message conversation using AI
   */
  const useMessageSummary = useCallback(async (messages) => {
    setLoading(true);
    resetState();

    try {
      const result = await ai.summarizeConversation(messages);
      setSuccess('Message summary generated');
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Message summary error:', err);
      setError(err.message || 'Failed to summarize messages');
      setLoading(false);
      throw err;
    }
  }, [resetState]);

  /**
   * Suggest skills based on candidate background
   */
  const useSuggestSkills = useCallback(async (background) => {
    setLoading(true);
    resetState();

    try {
      const result = await ai.suggestSkills(background);
      setSuccess('Skill suggestions generated');
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Skill suggestions error:', err);
      setError(err.message || 'Failed to suggest skills');
      setLoading(false);
      throw err;
    }
  }, [resetState]);

  return {
    // State
    loading,
    error,
    success,
    resetState,

    // Methods
    useFormValidation,
    useCompanyMatching,
    useProfileEnhancement,
    useCalendarSuggestions,
    useMessageSummary,
    useSuggestSkills,
  };
};

export default useAI;
