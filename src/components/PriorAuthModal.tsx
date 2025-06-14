
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

interface PriorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  verification: VerificationResult;
}

const PriorAuthModal = ({ isOpen, onClose, verification }: PriorAuthModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    serviceRequested: 'Medical Consultation',
    urgency: 'routine' as 'routine' | 'urgent' | 'stat',
    clinicalJustification: '',
    requestedBy: 'Dr. Provider',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const priorAuthService = new PriorAuthService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Initiating prior authorization for:', verification.patient.firstName, verification.patient.lastName);

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
      } else {
        toast({
          title: "Additional Information Required",
          description: result.message,
          variant: "destructive",
        });
        
        console.log('Prior auth needs more info:', result.message);
      }

      // Refresh the verifications data to show updated status
      await queryClient.invalidateQueries({ queryKey: ['verifications'] });
      
      // Close the modal after a brief delay to show the toast
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error submitting prior authorization:', error);
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
          {/* Patient Info (Read-only) */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm text-gray-700">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name: </span>
                <span className="font-medium">{verification.patient.firstName} {verification.patient.lastName}</span>
              </div>
              <div>
                <span className="text-gray-600">DOB: </span>
                <span className="font-medium">{verification.patient.dob}</span>
              </div>
              <div>
                <span className="text-gray-600">Insurance: </span>
                <span className="font-medium">{verification.patient.insuranceCompany}</span>
              </div>
              <div>
                <span className="text-gray-600">Policy: </span>
                <span className="font-medium">{verification.patient.policyNumber}</span>
              </div>
            </div>
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
