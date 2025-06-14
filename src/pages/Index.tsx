
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientForm from "@/components/PatientForm";
import VerificationResults from "@/components/VerificationResults";
import AuditLog from "@/components/AuditLog";
import { FileText, CheckCircle, AlertCircle, Clock } from "lucide-react";

export interface PatientData {
  firstName: string;
  lastName: string;
  dob: string;
  insuranceCompany: string;
  policyNumber: string;
  groupNumber?: string;
  memberID: string;
  subscriberName?: string;
}

export interface VerificationResult {
  id: string;
  timestamp: string;
  patient: PatientData;
  status: 'eligible' | 'ineligible' | 'requires_auth' | 'error' | 'pending';
  coverage: {
    active: boolean;
    effectiveDate?: string;
    terminationDate?: string;
    copay?: number;
    deductible?: number;
    inNetwork: boolean;
    priorAuthRequired: boolean;
  };
  nextSteps: string[];
}

const Index = () => {
  const [currentPatient, setCurrentPatient] = useState<PatientData | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verifications, setVerifications] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const handlePatientSubmit = async (patientData: PatientData) => {
    setCurrentPatient(patientData);
    setIsVerifying(true);
    
    console.log("Starting verification for patient:", patientData);
    
    // Simulate API call to clearinghouse
    try {
      const result = await mockEligibilityVerification(patientData);
      setVerificationResult(result);
      setVerifications(prev => [result, ...prev]);
      console.log("Verification completed:", result);
    } catch (error) {
      console.error("Verification failed:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const mockEligibilityVerification = async (patient: PatientData): Promise<VerificationResult> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock different scenarios based on patient data
    const scenarios = ['eligible', 'ineligible', 'requires_auth', 'error'] as const;
    const status = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    const result: VerificationResult = {
      id: `VER-${Date.now()}`,
      timestamp: new Date().toISOString(),
      patient,
      status,
      coverage: {
        active: status !== 'ineligible',
        effectiveDate: '2024-01-01',
        terminationDate: status === 'ineligible' ? '2024-05-30' : undefined,
        copay: status === 'eligible' ? 25 : undefined,
        deductible: status === 'eligible' ? 1500 : undefined,
        inNetwork: status === 'eligible',
        priorAuthRequired: status === 'requires_auth'
      },
      nextSteps: getNextSteps(status)
    };
    
    return result;
  };

  const getNextSteps = (status: VerificationResult['status']): string[] => {
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

  const getStatusIcon = (status: VerificationResult['status']) => {
    switch (status) {
      case 'eligible':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'ineligible':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'requires_auth':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: VerificationResult['status']) => {
    switch (status) {
      case 'eligible':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ineligible':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'requires_auth':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Pre-visit Insurance Verification</h1>
          </div>
          <p className="text-gray-600 text-lg">Streamline patient eligibility verification and appointment management</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Verifications</p>
                  <p className="text-2xl font-bold text-gray-900">{verifications.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Eligible</p>
                  <p className="text-2xl font-bold text-green-600">
                    {verifications.filter(v => v.status === 'eligible').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Needs Review</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {verifications.filter(v => v.status === 'requires_auth' || v.status === 'ineligible').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">
                    {verifications.filter(v => v.status === 'error').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="verification" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="verification">New Verification</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="verification" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PatientForm onSubmit={handlePatientSubmit} isLoading={isVerifying} />
              
              {(verificationResult || isVerifying) && (
                <VerificationResults 
                  result={verificationResult} 
                  isLoading={isVerifying}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Recent Verifications</CardTitle>
                <CardDescription>View and manage recent insurance verification results</CardDescription>
              </CardHeader>
              <CardContent>
                {verifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No verifications yet. Start by verifying a patient's insurance.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verifications.map((verification) => (
                      <div key={verification.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(verification.status)}
                            <div>
                              <h3 className="font-semibold">
                                {verification.patient.firstName} {verification.patient.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {verification.patient.insuranceCompany} - {verification.patient.policyNumber}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(verification.status)}>
                            {verification.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(verification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <AuditLog verifications={verifications} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
