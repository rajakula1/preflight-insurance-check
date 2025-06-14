import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientForm from "@/components/PatientForm";
import VerificationResults from "@/components/VerificationResults";
import AuditLog from "@/components/AuditLog";
import DashboardNotifications from "@/components/DashboardNotifications";
import { useVerifications } from "@/hooks/useVerifications";
import { FileText, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  aiInsights?: {
    reasoning?: string;
    recommendations?: string[];
    additionalQuestions?: string[];
  };
}

const Index = () => {
  const [currentVerificationResult, setCurrentVerificationResult] = useState<VerificationResult | null>(null);
  const { verifications, createVerification, isCreating, error: verificationsError } = useVerifications();
  const { toast } = useToast();

  const handlePatientSubmit = async (patientData: PatientData) => {
    try {
      console.log("Starting verification for patient:", patientData);
      
      const result = await createVerification(patientData);
      setCurrentVerificationResult(result);
      
      console.log("Verification completed:", result);
      
      // Show different toast messages based on the result
      if (result.status === 'eligible') {
        toast({
          title: "Verification Complete - Eligible",
          description: `${patientData.firstName} ${patientData.lastName} is eligible. EHR updated and confirmation sent.`,
        });
      } else if (result.status === 'requires_auth') {
        toast({
          title: "Prior Authorization Required",
          description: `Staff has been notified to initiate prior authorization for ${patientData.firstName} ${patientData.lastName}.`,
          variant: "destructive",
        });
      } else if (result.status === 'ineligible') {
        toast({
          title: "Coverage Ineligible",
          description: `Staff has been notified about coverage issues for ${patientData.firstName} ${patientData.lastName}.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verification Complete",
          description: `Insurance verification for ${patientData.firstName} ${patientData.lastName} has been processed.`,
        });
      }
    } catch (error) {
      console.error("Verification failed:", error);
      
      // Show more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Verification Failed",
        description: `Error: ${errorMessage}. Please check the console for more details.`,
        variant: "destructive",
      });
    }
  };

  // Show error state if there's an issue loading verifications
  if (verificationsError) {
    console.error("Error loading verifications:", verificationsError);
  }

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

        {/* Add Dashboard Notifications */}
        <div className="mb-8">
          <DashboardNotifications verifications={verifications} />
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
              <PatientForm onSubmit={handlePatientSubmit} isLoading={isCreating} />
              
              {(currentVerificationResult || isCreating) && (
                <VerificationResults 
                  result={currentVerificationResult} 
                  isLoading={isCreating}
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
