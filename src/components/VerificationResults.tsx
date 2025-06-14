
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, Clock, DollarSign, Calendar, Users, FileText, Loader2, Brain, MessageCircle } from "lucide-react";
import { VerificationResult } from "@/pages/Index";
import PriorAuthModal from "./PriorAuthModal";

interface VerificationResultsProps {
  result: VerificationResult | null;
  isLoading: boolean;
  getStatusIcon: (status: VerificationResult['status']) => React.ReactNode;
  getStatusColor: (status: VerificationResult['status']) => string;
}

const VerificationResults = ({ result, isLoading, getStatusIcon, getStatusColor }: VerificationResultsProps) => {
  const [isPriorAuthModalOpen, setIsPriorAuthModalOpen] = useState(false);

  const handlePriorAuthClick = () => {
    console.log('Prior Auth button clicked for verification:', result?.id);
    setIsPriorAuthModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <CardTitle>AI Verification in Progress</CardTitle>
          </div>
          <CardDescription>
            Our AI agent is analyzing the insurance information...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">AI Insurance Verification</p>
              <p className="text-sm text-gray-600 mb-4">Analyzing patient demographics and insurance details...</p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Validating insurance information</p>
                <p>• Checking coverage eligibility</p>
                <p>• Analyzing potential issues</p>
                <p>• Generating recommendations</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  const formatCurrency = (amount: number | undefined) => {
    return amount ? `$${amount.toLocaleString()}` : 'N/A';
  };

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(result.status)}
              <CardTitle>AI Verification Results</CardTitle>
            </div>
            <Badge className={getStatusColor(result.status)}>
              {result.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <CardDescription>
            AI-powered verification for {result.patient.firstName} {result.patient.lastName} - {result.id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Insights Section */}
          {result.aiInsights && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  AI Analysis
                </h3>
                {result.aiInsights.reasoning && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">{result.aiInsights.reasoning}</p>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Coverage Status */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Coverage Status
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Active Coverage</p>
                <p className="font-medium">{result.coverage.active ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-600">In-Network</p>
                <p className="font-medium">{result.coverage.inNetwork ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-600">Effective Date</p>
                <p className="font-medium">{formatDate(result.coverage.effectiveDate)}</p>
              </div>
              <div>
                <p className="text-gray-600">Termination Date</p>
                <p className="font-medium">{formatDate(result.coverage.terminationDate)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Copay</p>
                <p className="font-medium">{formatCurrency(result.coverage.copay)}</p>
              </div>
              <div>
                <p className="text-gray-600">Deductible</p>
                <p className="font-medium">{formatCurrency(result.coverage.deductible)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Authorization Requirements */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Authorization
            </h3>
            <div className="flex items-center gap-2">
              {result.coverage.priorAuthRequired ? (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">Prior Authorization Required</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">No Prior Authorization Needed</span>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* AI Recommendations */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4" />
              AI Recommendations
            </h3>
            <div className="space-y-2">
              {result.nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mt-0.5">
                    {index + 1}
                  </div>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Questions */}
          {result.aiInsights?.additionalQuestions && result.aiInsights.additionalQuestions.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Additional Questions for Patient
                </h3>
                <div className="space-y-2">
                  {result.aiInsights.additionalQuestions.map((question, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm bg-yellow-50 p-3 rounded-lg">
                      <MessageCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-yellow-800">{question}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {result.status === 'eligible' && (
              <Button className="bg-green-600 hover:bg-green-700">
                Confirm Appointment
              </Button>
            )}
            {result.status === 'requires_auth' && (
              <Button 
                className="bg-yellow-600 hover:bg-yellow-700"
                onClick={handlePriorAuthClick}
              >
                Initiate Prior Auth
              </Button>
            )}
            {(result.status === 'ineligible' || result.status === 'error') && (
              <Button variant="outline">
                Manual Review Required
              </Button>
            )}
            <Button variant="outline">
              Update EHR Record
            </Button>
            <Button variant="outline">
              Print Results
            </Button>
          </div>

          {/* Verification Details */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Verification Details</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Verification ID: {result.id}</p>
              <p>Timestamp: {new Date(result.timestamp).toLocaleString()}</p>
              <p>Patient: {result.patient.firstName} {result.patient.lastName} (DOB: {result.patient.dob})</p>
              <p>Insurance: {result.patient.insuranceCompany} - Policy: {result.patient.policyNumber}</p>
              <p className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                Verified using AI Agent
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prior Auth Modal */}
      <PriorAuthModal
        isOpen={isPriorAuthModalOpen}
        onClose={() => setIsPriorAuthModalOpen(false)}
        verification={result}
      />
    </>
  );
};

export default VerificationResults;
