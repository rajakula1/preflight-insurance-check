import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PatientData, VerificationResult } from '@/pages/Index';
import IntegrationService, { IntegrationConfig } from '@/services/integrationService';

// Configuration for integrations - in a real app, this would come from settings
const integrationConfig: IntegrationConfig = {
  fhir: {
    enabled: false, // Set to true when FHIR endpoint is configured
    baseUrl: '', // Would be set from environment or settings
    apiKey: '', // Would be set from environment or settings
  },
  notifications: {
    emailEnabled: true,
    slackEnabled: true,
    slackWebhookUrl: '', // Would be set from environment or settings
    emailRecipients: ['staff@healthcare.com'], // Would be configurable
  },
};

export const useVerifications = () => {
  const queryClient = useQueryClient();
  const [integrationService] = useState(() => new IntegrationService(integrationConfig));

  // Fetch all verification requests
  const { data: verifications = [], isLoading, error } = useQuery({
    queryKey: ['verifications'],
    queryFn: async () => {
      console.log('Fetching verifications from Supabase...');
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching verifications:', error);
        throw error;
      }

      console.log('Fetched verifications:', data);
      
      // Transform database records to match our VerificationResult interface
      return data.map(transformToVerificationResult);
    },
  });

  // Create a new verification request using AI
  const createVerification = useMutation({
    mutationFn: async (patientData: PatientData) => {
      console.log('Starting AI verification for patient:', patientData);
      
      try {
        // Call the AI verification edge function
        const { data, error } = await supabase.functions.invoke('ai-insurance-verification', {
          body: { patientData }
        });

        if (error) {
          console.error('AI verification error:', error);
          // Provide more specific error message
          if (error.message?.includes('Too Many Requests')) {
            throw new Error('AI service is currently busy. Please wait a moment and try again.');
          } else if (error.message?.includes('Edge Function returned a non-2xx status code')) {
            throw new Error('Verification service is temporarily unavailable. Please try again later.');
          }
          throw new Error(error.message || 'Verification failed');
        }

        console.log('AI verification completed:', data);
        
        // Process the result through integrations
        await integrationService.processVerificationResult(data);
        
        return data;
      } catch (error) {
        console.error('Error in AI verification:', error);
        // Improve error messages for better user experience
        if (error instanceof Error) {
          if (error.message.includes('Too Many Requests') || error.message.includes('429')) {
            throw new Error('AI service is currently busy due to high demand. Please wait a moment and try again.');
          } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
            throw new Error('AI service configuration issue. Please contact support.');
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      console.log('AI verification completed successfully, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
    onError: (error) => {
      console.error('AI verification mutation error:', error);
    }
  });

  return {
    verifications,
    isLoading,
    error,
    createVerification: createVerification.mutateAsync,
    isCreating: createVerification.isPending,
    integrationService,
  };
};

// Transform database record to VerificationResult interface
const transformToVerificationResult = (record: any): VerificationResult => {
  const coverage = record.verification_result || {
    active: false,
    inNetwork: false,
    priorAuthRequired: false
  };

  return {
    id: record.id,
    timestamp: record.created_at,
    patient: {
      firstName: record.patient_first_name,
      lastName: record.patient_last_name,
      dob: record.patient_dob,
      insuranceCompany: record.insurance_company,
      policyNumber: record.policy_number,
      groupNumber: record.group_number,
      memberID: record.member_id,
      subscriberName: record.subscriber_name,
    },
    status: record.status,
    coverage,
    nextSteps: coverage.recommendations || getNextSteps(record.status),
    aiInsights: {
      reasoning: coverage.aiReasoning,
      recommendations: coverage.recommendations,
      additionalQuestions: coverage.additionalQuestions
    }
  };
};

const getNextSteps = (status: string): string[] => {
  switch (status) {
    case 'eligible':
      return ['Auto-confirm appointment', 'Send confirmation to patient', 'Update EHR record'];
    case 'ineligible':
      return ['Contact patient about coverage', 'Discuss payment options', 'Reschedule if needed'];
    case 'requires_auth':
      return ['Initiate prior authorization', 'Contact insurance provider', 'Hold appointment pending approval'];
    case 'error':
      return ['Manual verification required', 'Contact clearinghouse support', 'Retry verification'];
    default:
      return [];
  }
};
