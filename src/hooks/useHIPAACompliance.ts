
import { useState, useEffect } from 'react';
import HIPAAComplianceService from '@/services/hipaaComplianceService';

export const useHIPAACompliance = () => {
  const [hipaaService] = useState(() => new HIPAAComplianceService());
  const [isCompliant, setIsCompliant] = useState(true);

  // Log page access for HIPAA audit trail
  const logAccess = async (
    action: 'view' | 'create' | 'update' | 'delete' | 'export' | 'print',
    resourceType: 'verification' | 'prior_auth' | 'patient_data',
    resourceId: string,
    success: boolean = true,
    errorMessage?: string
  ) => {
    await hipaaService.logAccess({
      user_id: 'current_user', // Replace with actual user ID from auth
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      success,
      error_message: errorMessage,
    });
  };

  // Mask sensitive data for display
  const maskSensitiveData = (data: string, type: 'ssn' | 'policy' | 'phone' | 'email') => {
    return hipaaService.maskPHI(data, type);
  };

  // Validate user access to PHI
  const validateAccess = (userRole: string, action: string) => {
    return hipaaService.validatePHIAccess(userRole, action);
  };

  // Check compliance status on mount
  useEffect(() => {
    const checkCompliance = async () => {
      try {
        const report = await hipaaService.generateComplianceReport(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
          new Date().toISOString()
        );
        
        const hasViolations = report.retentionViolations.length > 0 || report.unauthorizedAttempts > 10;
        setIsCompliant(!hasViolations);
      } catch (error) {
        console.error('Compliance check failed:', error);
        setIsCompliant(false);
      }
    };

    checkCompliance();
  }, [hipaaService]);

  return {
    hipaaService,
    isCompliant,
    logAccess,
    maskSensitiveData,
    validateAccess,
  };
};
