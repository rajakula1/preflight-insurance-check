
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, CreditCard, Loader2 } from "lucide-react";
import { PatientData } from "@/pages/Index";

interface PatientFormProps {
  onSubmit: (data: PatientData) => void;
  isLoading?: boolean;
}

const PatientForm = ({ onSubmit, isLoading = false }: PatientFormProps) => {
  const [formData, setFormData] = useState<PatientData>({
    firstName: '',
    lastName: '',
    dob: '',
    insuranceCompany: '',
    policyNumber: '',
    groupNumber: '',
    memberID: '',
    subscriberName: ''
  });

  const [errors, setErrors] = useState<Partial<PatientData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<PatientData> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dob) newErrors.dob = 'Date of birth is required';
    if (!formData.insuranceCompany.trim()) newErrors.insuranceCompany = 'Insurance company is required';
    if (!formData.policyNumber.trim()) newErrors.policyNumber = 'Policy number is required';
    if (!formData.memberID.trim()) newErrors.memberID = 'Member ID is required';

    // Validate DOB format and reasonable date
    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 120);
      
      if (dobDate > today) {
        newErrors.dob = 'Date of birth cannot be in the future';
      } else if (dobDate < minDate) {
        newErrors.dob = 'Please enter a valid date of birth';
      }
    }

    // Validate policy number format (basic)
    if (formData.policyNumber && !/^[A-Z0-9]{3,20}$/i.test(formData.policyNumber)) {
      newErrors.policyNumber = 'Policy number should be 3-20 alphanumeric characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      console.log("Form submitted with data:", formData);
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof PatientData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          <CardTitle>Patient & Insurance Information</CardTitle>
        </div>
        <CardDescription>
          Enter patient demographics and insurance details for AI-powered eligibility verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Demographics */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Patient Demographics</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => handleInputChange('dob', e.target.value)}
                className={errors.dob ? 'border-red-500' : ''}
              />
              {errors.dob && <p className="text-sm text-red-500">{errors.dob}</p>}
            </div>
          </div>

          <Separator />

          {/* Insurance Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Insurance Information</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="insuranceCompany">Insurance Company *</Label>
              <Input
                id="insuranceCompany"
                value={formData.insuranceCompany}
                onChange={(e) => handleInputChange('insuranceCompany', e.target.value)}
                placeholder="e.g., Aetna, Blue Cross Blue Shield, Cigna"
                className={errors.insuranceCompany ? 'border-red-500' : ''}
              />
              {errors.insuranceCompany && <p className="text-sm text-red-500">{errors.insuranceCompany}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="policyNumber">Policy Number *</Label>
                <Input
                  id="policyNumber"
                  value={formData.policyNumber}
                  onChange={(e) => handleInputChange('policyNumber', e.target.value.toUpperCase())}
                  placeholder="Enter policy number"
                  className={errors.policyNumber ? 'border-red-500' : ''}
                />
                {errors.policyNumber && <p className="text-sm text-red-500">{errors.policyNumber}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="groupNumber">Group Number</Label>
                <Input
                  id="groupNumber"
                  value={formData.groupNumber}
                  onChange={(e) => handleInputChange('groupNumber', e.target.value)}
                  placeholder="Enter group number (if applicable)"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="memberID">Member ID *</Label>
              <Input
                id="memberID"
                value={formData.memberID}
                onChange={(e) => handleInputChange('memberID', e.target.value)}
                placeholder="Enter member ID"
                className={errors.memberID ? 'border-red-500' : ''}
              />
              {errors.memberID && <p className="text-sm text-red-500">{errors.memberID}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subscriberName">Subscriber Name</Label>
              <Input
                id="subscriberName"
                value={formData.subscriberName}
                onChange={(e) => handleInputChange('subscriberName', e.target.value)}
                placeholder="Enter subscriber name (if different from patient)"
              />
              <p className="text-xs text-gray-500">Only required if patient is not the primary subscriber</p>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI Analyzing Insurance...
              </>
            ) : (
              'Verify with AI Agent'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PatientForm;
