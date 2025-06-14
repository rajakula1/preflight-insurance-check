
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Filter, Calendar, User, FileText } from "lucide-react";
import { VerificationResult } from "@/pages/Index";

interface AuditLogProps {
  verifications: VerificationResult[];
}

const AuditLog = ({ verifications }: AuditLogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Filter verifications based on search and filters
  const filteredVerifications = verifications.filter(verification => {
    const matchesSearch = 
      verification.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verification.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verification.patient.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verification.patient.insuranceCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verification.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || verification.status === statusFilter;

    const matchesDate = (() => {
      if (dateFilter === 'all') return true;
      
      const verificationDate = new Date(verification.timestamp);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          return verificationDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return verificationDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return verificationDate >= monthAgo;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesDate;
  });

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

  const exportToCSV = () => {
    const headers = ['Verification ID', 'Timestamp', 'Patient Name', 'Insurance Company', 'Policy Number', 'Status', 'Active Coverage', 'In Network', 'Copay', 'Deductible'];
    
    const csvData = filteredVerifications.map(v => [
      v.id,
      new Date(v.timestamp).toLocaleString(),
      `${v.patient.firstName} ${v.patient.lastName}`,
      v.patient.insuranceCompany,
      v.patient.policyNumber,
      v.status,
      v.coverage.active ? 'Yes' : 'No',
      v.coverage.inNetwork ? 'Yes' : 'No',
      v.coverage.copay || 'N/A',
      v.coverage.deductible || 'N/A'
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insurance-verification-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Audit Log
            </CardTitle>
            <CardDescription>
              View and search through all insurance verification records
            </CardDescription>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by patient name, policy number, or verification ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="eligible">Eligible</SelectItem>
              <SelectItem value="ineligible">Ineligible</SelectItem>
              <SelectItem value="requires_auth">Requires Auth</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Summary */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Showing {filteredVerifications.length} of {verifications.length} records</span>
          {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Verification Records */}
        <div className="space-y-4">
          {filteredVerifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {verifications.length === 0 
                ? "No verification records found. Start by verifying a patient's insurance."
                : "No records match your search criteria. Try adjusting your filters."
              }
            </div>
          ) : (
            filteredVerifications.map((verification) => (
              <div key={verification.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {verification.patient.firstName} {verification.patient.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {verification.patient.insuranceCompany} • Policy: {verification.patient.policyNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        DOB: {verification.patient.dob} • Member ID: {verification.patient.memberID}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getStatusColor(verification.status)}>
                      {verification.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(verification.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Coverage</p>
                    <p className="font-medium">{verification.coverage.active ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Network</p>
                    <p className="font-medium">{verification.coverage.inNetwork ? 'In-Network' : 'Out-of-Network'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Copay</p>
                    <p className="font-medium">{verification.coverage.copay ? `$${verification.coverage.copay}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Prior Auth</p>
                    <p className="font-medium">{verification.coverage.priorAuthRequired ? 'Required' : 'Not Required'}</p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    Verification ID: {verification.id}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditLog;
