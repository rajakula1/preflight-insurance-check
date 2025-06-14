
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Clock } from "lucide-react";
import { VerificationResult } from "@/pages/Index";
import PriorAuthService, { PriorAuthRequest } from "@/services/priorAuthService";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { useHIPAACompliance } from '@/hooks/useHIPAACompliance';
import SecurePatientData from './SecurePatientData';

interface PriorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  verification: VerificationResult;
}

const PriorAuthModal = ({ isOpen, onClose, verification }: PriorAuthModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [formData, setFormData] = useState({
    serviceRequested: 'Medical Consultation',
    urgency: 'routine' as 'routine' | 'urgent' | 'stat',
    clinicalJustification: '',
    requestedBy: 'Dr. Provider',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAccess } = useHIPAACompliance();
  const priorAuthService = new PriorAuthService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Initiating prior authorization for:', verification.patient.firstName, verification.patient.lastName);

      // Log HIPAA audit trail for prior auth creation
      await logAccess('create', 'prior_auth', verification.id, true);

      // Create the prior auth request
      const priorAuthRequest = await priorAuthService.createPriorAuthRequest(verification, formData);
      
      // Submit to insurance
      const result = await priorAuthService.submitToInsurance(priorAuthRequest);
      
      if (result.success) {
        toast({
          title: "Prior Authorization Approved",
          description: result.message,
        });
        
        console.log('Prior auth successfully submitted with auth number:', result.authNumber);
        
        // Log successful submission
        await logAccess('create', 'prior_auth', priorAuthRequest.id!, true);
      } else {
        toast({
          title: "Additional Information Required",
          description: result.message,
          variant: "destructive",
        });
        
        console.log('Prior auth needs more info:', result.message);
        
        // Log submission that needs more info
        await logAccess('create', 'prior_auth', priorAuthRequest.id!, false, result.message);
      }

      // Refresh the verifications data to show updated status
      await queryClient.invalidateQueries({ queryKey: ['verifications'] });
      
      // Close the modal after a brief delay to show the toast
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error submitting prior authorization:', error);
      
      // Log failed submission
      await logAccess('create', 'prior_auth', verification.id, false, error instanceof Error ? error.message : 'Unknown error');
      
      toast({
        title: "Submission Failed",
        description: "There was an error submitting the prior authorization request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <DialogTitle>Initiate Prior Authorization</DialogTitle>
          </div>
          <DialogDescription>
            Submit a prior authorization request for {verification.patient.firstName} {verification.patient.lastName} 
            with {verification.patient.insuranceCompany}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Secure Patient Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <SecurePatientData 
              patient={verification.patient}
              showSensitive={showSensitiveData}
              onToggleSensitive={() => setShowSensitiveData(!showSensitiveData)}
            />
          </div>

          {/* Service Requested */}
          <div className="space-y-2">
            <Label htmlFor="serviceRequested">Service/Procedure Requested</Label>
            <Input
              id="serviceRequested"
              value={formData.serviceRequested}
              onChange={(e) => setFormData({ ...formData, serviceRequested: e.target.value })}
              placeholder="e.g., Medical Consultation, MRI, Surgery"
              required
            />
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <Label htmlFor="urgency">Urgency Level</Label>
            <Select value={formData.urgency} onValueChange={(value: 'routine' | 'urgent' | 'stat') => setFormData({ ...formData, urgency: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine">Routine (5-10 business days)</SelectItem>
                <SelectItem value="urgent">Urgent (24-72 hours)</SelectItem>
                <SelectItem value="stat">STAT (Immediate)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clinical Justification */}
          <div className="space-y-2">
            <Label htmlFor="clinicalJustification">Clinical Justification</Label>
            <Textarea
              id="clinicalJustification"
              value={formData.clinicalJustification}
              onChange={(e) => setFormData({ ...formData, clinicalJustification: e.target.value })}
              placeholder="Provide detailed medical necessity and clinical reasoning for this service..."
              rows={4}
              required
            />
          </div>

          {/* Requesting Provider */}
          <div className="space-y-2">
            <Label htmlFor="requestedBy">Requesting Provider</Label>
            <Input
              id="requestedBy"
              value={formData.requestedBy}
              onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
              placeholder="Dr. Provider Name"
              required
            />
          </div>

          {/* HIPAA Notice */}
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <p className="font-medium">HIPAA Privacy Notice</p>
            <p>This prior authorization request contains protected health information. All access and modifications are logged for security audit purposes.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Submit Prior Auth
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PriorAuthModal;
