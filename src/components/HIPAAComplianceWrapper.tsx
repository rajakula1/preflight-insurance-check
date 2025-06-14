
import React, { useEffect } from 'react';
import { useHIPAACompliance } from '@/hooks/useHIPAACompliance';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface HIPAAComplianceWrapperProps {
  children: React.ReactNode;
  resourceType: 'verification' | 'prior_auth' | 'patient_data';
  resourceId: string;
  action: 'view' | 'create' | 'update' | 'delete' | 'export' | 'print';
}

const HIPAAComplianceWrapper = ({ 
  children, 
  resourceType, 
  resourceId, 
  action 
}: HIPAAComplianceWrapperProps) => {
  const { isCompliant, logAccess, validateAccess } = useHIPAACompliance();
  
  // Log access when component mounts
  useEffect(() => {
    logAccess(action, resourceType, resourceId, true);
  }, [logAccess, action, resourceType, resourceId]);

  // Check user permissions (in production, get actual user role from auth)
  const userRole = 'staff'; // Replace with actual user role
  const hasPermission = validateAccess(userRole, action);

  if (!hasPermission) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Access denied. You do not have permission to {action} this {resourceType}.
          This access attempt has been logged for security audit.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="relative">
      {!isCompliant && (
        <Alert className="mb-4 border-yellow-200 bg-yellow-50">
          <Shield className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            HIPAA Compliance Warning: System has detected potential compliance issues. 
            Please contact your system administrator.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="relative">
        {children}
        
        {/* HIPAA compliance indicator */}
        <div className="absolute top-0 right-0 flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-bl">
          <Shield className="h-3 w-3" />
          <span>HIPAA Protected</span>
        </div>
      </div>
    </div>
  );
};

export default HIPAAComplianceWrapper;
