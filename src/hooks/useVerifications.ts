
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PatientData, VerificationResult } from '@/pages/Index';

export const useVerifications = () => {
  const queryClient = useQueryClient();

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

  // Create a new verification request
  const createVerification = useMutation({
    mutationFn: async (patientData: PatientData) => {
      console.log('Creating verification with patient data:', patientData);
      
      try {
        // First, insert the initial request
        const insertData = {
          patient_first_name: patientData.firstName,
          patient_last_name: patientData.lastName,
          patient_dob: patientData.dob,
          insurance_company: patientData.insuranceCompany,
          policy_number: patientData.policyNumber,
          group_number: patientData.groupNumber || null,
          member_id: patientData.memberID,
          subscriber_name: patientData.subscriberName || null,
          status: 'pending'
        };

        console.log('Inserting data into Supabase:', insertData);

        const { data, error } = await supabase
          .from('verification_requests')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('Error inserting verification request:', error);
          throw error;
        }

        console.log('Successfully inserted verification request:', data);

        // Simulate the verification process
        const verificationResult = await simulateVerification(patientData);
        
        console.log('Verification result:', verificationResult);

        // Update the record with the verification result
        const { data: updatedData, error: updateError } = await supabase
          .from('verification_requests')
          .update({
            status: verificationResult.status,
            verification_result: verificationResult.coverage
          })
          .eq('id', data.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating verification request:', updateError);
          throw updateError;
        }

        console.log('Successfully updated verification request:', updatedData);

        return transformToVerificationResult(updatedData);
      } catch (error) {
        console.error('Error in createVerification:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Verification created successfully, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    }
  });

  return {
    verifications,
    isLoading,
    error,
    createVerification: createVerification.mutateAsync,
    isCreating: createVerification.isPending,
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
    nextSteps: getNextSteps(record.status)
  };
};

// Simulate verification process (same logic as before)
const simulateVerification = async (patient: PatientData) => {
  console.log('Simulating verification for patient:', patient);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock different scenarios based on patient data
  const scenarios = ['eligible', 'ineligible', 'requires_auth', 'error'] as const;
  const status = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  const result = {
    status,
    coverage: {
      active: status !== 'ineligible',
      effectiveDate: '2024-01-01',
      terminationDate: status === 'ineligible' ? '2024-05-30' : undefined,
      copay: status === 'eligible' ? 25 : undefined,
      deductible: status === 'eligible' ? 1500 : undefined,
      inNetwork: status === 'eligible',
      priorAuthRequired: status === 'requires_auth'
    }
  };

  console.log('Simulation result:', result);
  return result;
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
