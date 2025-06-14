
import React from 'react';
import { useHIPAACompliance } from '@/hooks/useHIPAACompliance';
import { PatientData } from '@/pages/Index';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SecurePatientDataProps {
  patient: PatientData;
  showSensitive?: boolean;
  onToggleSensitive?: () => void;
}

const SecurePatientData = ({ 
  patient, 
  showSensitive = false, 
  onToggleSensitive 
}: SecurePatientDataProps) => {
  const { maskSensitiveData, logAccess } = useHIPAACompliance();

  const handleSensitiveDataView = () => {
    if (!showSensitive) {
      logAccess('view', 'patient_data', `${patient.firstName}-${patient.lastName}`, true);
    }
    onToggleSensitive?.();
  };

  const displayPolicyNumber = showSensitive 
    ? patient.policyNumber 
    : maskSensitiveData(patient.policyNumber, 'policy');

  const displayMemberID = showSensitive 
    ? patient.memberID 
    : maskSensitiveData(patient.memberID || '', 'policy');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Patient Information</h3>
        {onToggleSensitive && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSensitiveDataView}
            className="flex items-center gap-2"
          >
            {showSensitive ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Sensitive
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show Sensitive
              </>
            )}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Name: </span>
          <span className="font-medium">{patient.firstName} {patient.lastName}</span>
        </div>
        <div>
          <span className="text-gray-600">DOB: </span>
          <span className="font-medium">{patient.dob}</span>
        </div>
        <div>
          <span className="text-gray-600">Insurance: </span>
          <span className="font-medium">{patient.insuranceCompany}</span>
        </div>
        <div>
          <span className="text-gray-600">Policy: </span>
          <span className="font-medium">{displayPolicyNumber}</span>
          {!showSensitive && (
            <span className="ml-2 text-xs text-blue-600 cursor-pointer" onClick={handleSensitiveDataView}>
              (Click to reveal)
            </span>
          )}
        </div>
        {patient.memberID && (
          <div>
            <span className="text-gray-600">Member ID: </span>
            <span className="font-medium">{displayMemberID}</span>
          </div>
        )}
        {patient.groupNumber && (
          <div>
            <span className="text-gray-600">Group: </span>
            <span className="font-medium">{patient.groupNumber}</span>
          </div>
        )}
      </div>

      {showSensitive && (
        <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
          ⚠️ Sensitive patient data is currently visible. Please ensure this information is handled securely.
        </div>
      )}
    </div>
  );
};

export default SecurePatientData;
