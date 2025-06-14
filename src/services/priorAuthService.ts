
import { supabase } from '@/integrations/supabase/client';
import { VerificationResult } from '@/pages/Index';

export interface PriorAuthRequest {
  id?: string;
  verificationId: string;
  patientName: string;
  insuranceCompany: string;
  policyNumber: string;
  serviceRequested: string;
  urgency: 'routine' | 'urgent' | 'stat';
  clinicalJustification: string;
  requestedBy: string;
  status: 'pending' | 'submitted' | 'approved' | 'denied' | 'more_info_needed';
  submittedAt?: string;
  responseReceived?: string;
  authNumber?: string;
  notes?: string;
}

class PriorAuthService {
  async createPriorAuthRequest(verification: VerificationResult, requestData: Partial<PriorAuthRequest>): Promise<PriorAuthRequest> {
    console.log('Creating prior authorization request for:', verification.patient.firstName, verification.patient.lastName);

    const priorAuthRequest: Omit<PriorAuthRequest, 'id'> = {
      verificationId: verification.id,
      patientName: `${verification.patient.firstName} ${verification.patient.lastName}`,
      insuranceCompany: verification.patient.insuranceCompany,
      policyNumber: verification.patient.policyNumber,
      serviceRequested: requestData.serviceRequested || 'Medical Consultation',
      urgency: requestData.urgency || 'routine',
      clinicalJustification: requestData.clinicalJustification || 'Medical consultation required based on patient symptoms and medical history.',
      requestedBy: requestData.requestedBy || 'Dr. Provider',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    // In a real implementation, this would be stored in a database
    // For now, we'll simulate the request creation
    const mockRequest: PriorAuthRequest = {
      id: `PA-${Date.now()}`,
      ...priorAuthRequest,
    };

    console.log('Prior authorization request created:', mockRequest);

    // Update the verification record to link it to the prior auth request
    await this.updateVerificationWithPriorAuth(verification.id, mockRequest.id!);

    return mockRequest;
  }

  async updateVerificationWithPriorAuth(verificationId: string, priorAuthId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('verification_requests')
        .update({
          verification_result: {
            priorAuthRequestId: priorAuthId,
            priorAuthStatus: 'pending'
          }
        })
        .eq('id', verificationId);

      if (error) {
        console.error('Error updating verification with prior auth:', error);
      } else {
        console.log('Verification updated with prior auth request ID:', priorAuthId);
      }
    } catch (error) {
      console.error('Failed to update verification:', error);
    }
  }

  async submitToInsurance(priorAuthRequest: PriorAuthRequest): Promise<{ success: boolean; message: string; authNumber?: string }> {
    console.log('Submitting prior auth request to insurance:', priorAuthRequest.insuranceCompany);

    // Simulate insurance submission
    const isApproved = Math.random() > 0.3; // 70% approval rate for demo
    
    if (isApproved) {
      const authNumber = `AUTH-${Date.now()}`;
      console.log('Prior authorization approved with number:', authNumber);
      
      return {
        success: true,
        message: `Prior authorization approved. Authorization number: ${authNumber}`,
        authNumber
      };
    } else {
      console.log('Prior authorization requires more information');
      
      return {
        success: false,
        message: 'Prior authorization requires additional clinical documentation. Please provide more details about the medical necessity.'
      };
    }
  }

  async trackAuthStatus(priorAuthId: string): Promise<PriorAuthRequest | null> {
    console.log('Tracking prior auth status for ID:', priorAuthId);
    
    // In a real implementation, this would query the database
    // For now, return a mock status
    return {
      id: priorAuthId,
      verificationId: 'mock-verification-id',
      patientName: 'John Doe',
      insuranceCompany: 'Example Insurance',
      policyNumber: '123456789',
      serviceRequested: 'Medical Consultation',
      urgency: 'routine',
      clinicalJustification: 'Medical consultation required',
      requestedBy: 'Dr. Provider',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
  }
}

export default PriorAuthService;
