import { supabase } from '@/integrations/supabase/client';

export interface HIPAAAuditLog {
  id?: string;
  user_id: string;
  action: 'view' | 'create' | 'update' | 'delete' | 'export' | 'print';
  resource_type: 'verification' | 'prior_auth' | 'patient_data';
  resource_id: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  success: boolean;
  error_message?: string;
}

export interface DataRetentionPolicy {
  resourceType: string;
  retentionPeriodDays: number;
  autoDeleteEnabled: boolean;
}

class HIPAAComplianceService {
  private readonly ENCRYPTION_KEY = 'HIPAA_ENCRYPTION_KEY';
  
  // Data retention policies per HIPAA requirements
  private readonly retentionPolicies: DataRetentionPolicy[] = [
    { resourceType: 'verification_requests', retentionPeriodDays: 2555, autoDeleteEnabled: true }, // 7 years
    { resourceType: 'prior_auth_requests', retentionPeriodDays: 2555, autoDeleteEnabled: true }, // 7 years
    { resourceType: 'hipaa_audit_logs', retentionPeriodDays: 2555, autoDeleteEnabled: false }, // 7 years, manual review
  ];

  async logAccess(auditData: Omit<HIPAAAuditLog, 'id' | 'timestamp' | 'ip_address' | 'user_agent'>): Promise<void> {
    try {
      const clientInfo = this.getClientInfo();
      
      const auditLog: Omit<HIPAAAuditLog, 'id'> = {
        ...auditData,
        timestamp: new Date().toISOString(),
        ip_address: clientInfo.ipAddress,
        user_agent: clientInfo.userAgent,
      };

      // Use RPC function to insert audit log
      const { error } = await supabase.rpc('insert_hipaa_audit_log' as any, {
        p_user_id: auditLog.user_id,
        p_action: auditLog.action,
        p_resource_type: auditLog.resource_type,
        p_resource_id: auditLog.resource_id,
        p_ip_address: auditLog.ip_address,
        p_user_agent: auditLog.user_agent,
        p_success: auditLog.success,
        p_error_message: auditLog.error_message || null
      });

      if (error) {
        console.error('Failed to log HIPAA audit entry:', error);
        // Fallback: try direct insert if RPC fails
        await this.fallbackAuditLog(auditLog);
      }
    } catch (error) {
      console.error('HIPAA audit logging error:', error);
      // In production, this should trigger an alert
    }
  }

  private async fallbackAuditLog(auditLog: Omit<HIPAAAuditLog, 'id'>): Promise<void> {
    try {
      // Direct insert using the typed table from database schema
      const { error } = await supabase
        .from('hipaa_audit_logs')
        .insert({
          user_id: auditLog.user_id,
          action: auditLog.action,
          resource_type: auditLog.resource_type,
          resource_id: auditLog.resource_id,
          ip_address: auditLog.ip_address,
          user_agent: auditLog.user_agent,
          timestamp: auditLog.timestamp,
          success: auditLog.success,
          error_message: auditLog.error_message
        });
      
      if (error) {
        console.error('Fallback audit logging also failed:', error);
      }
    } catch (error) {
      console.error('Fallback audit logging error:', error);
    }
  }

  async getAuditLogs(filters?: {
    userId?: string;
    resourceType?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<HIPAAAuditLog[]> {
    try {
      // Use RPC to get audit logs
      const { data, error } = await supabase.rpc('get_hipaa_audit_logs' as any, {
        p_user_id: filters?.userId || null,
        p_resource_type: filters?.resourceType || null,
        p_action: filters?.action || null,
        p_start_date: filters?.startDate || null,
        p_end_date: filters?.endDate || null
      });
      
      if (error) {
        console.error('Failed to retrieve audit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  }

  // Encrypt sensitive data before storage
  encryptPHI(data: string): string {
    try {
      // In production, use proper encryption library like crypto-js
      // This is a simplified example - use AES-256 encryption in production
      return btoa(data); // Base64 encoding as placeholder
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt PHI data');
    }
  }

  // Decrypt sensitive data after retrieval
  decryptPHI(encryptedData: string): string {
    try {
      return atob(encryptedData); // Base64 decoding as placeholder
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt PHI data');
    }
  }

  // Mask sensitive data for display
  maskPHI(data: string, type: 'ssn' | 'policy' | 'phone' | 'email'): string {
    if (!data) return '';
    
    switch (type) {
      case 'ssn':
        return `***-**-${data.slice(-4)}`;
      case 'policy':
        return `${data.slice(0, 2)}***${data.slice(-2)}`;
      case 'phone':
        return `(***) ***-${data.slice(-4)}`;
      case 'email':
        const [username, domain] = data.split('@');
        return `${username.slice(0, 2)}***@${domain}`;
      default:
        return '***';
    }
  }

  // Validate data retention compliance
  async enforceDataRetention(): Promise<void> {
    for (const policy of this.retentionPolicies) {
      if (!policy.autoDeleteEnabled) continue;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

      try {
        let error: any = null;
        
        if (policy.resourceType === 'verification_requests') {
          const result = await supabase
            .from('verification_requests')
            .delete()
            .lt('created_at', cutoffDate.toISOString());
          error = result.error;
        }

        if (error) {
          console.error(`Data retention enforcement failed for ${policy.resourceType}:`, error);
          // Log this as a compliance issue
          await this.logAccess({
            user_id: 'system',
            action: 'delete',
            resource_type: policy.resourceType as any,
            resource_id: 'bulk_retention_cleanup',
            success: false,
            error_message: error.message,
          });
        }
      } catch (error) {
        console.error(`Data retention error for ${policy.resourceType}:`, error);
      }
    }
  }

  // Generate compliance report
  async generateComplianceReport(startDate: string, endDate: string): Promise<{
    totalAccesses: number;
    unauthorizedAttempts: number;
    dataExports: number;
    retentionViolations: string[];
  }> {
    const auditLogs = await this.getAuditLogs({ startDate, endDate });
    
    const totalAccesses = auditLogs.length;
    const unauthorizedAttempts = auditLogs.filter(log => !log.success).length;
    const dataExports = auditLogs.filter(log => log.action === 'export' || log.action === 'print').length;
    
    // Check for retention violations
    const retentionViolations: string[] = [];
    for (const policy of this.retentionPolicies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);
      
      let data: any[] = [];
      let error: any = null;
      
      if (policy.resourceType === 'verification_requests') {
        const result = await supabase
          .from('verification_requests')
          .select('id, created_at')
          .lt('created_at', cutoffDate.toISOString());
        data = result.data || [];
        error = result.error;
      }
      
      if (!error && data && data.length > 0) {
        retentionViolations.push(`${policy.resourceType}: ${data.length} records exceed retention period`);
      }
    }

    return {
      totalAccesses,
      unauthorizedAttempts,
      dataExports,
      retentionViolations,
    };
  }

  private getClientInfo(): { ipAddress: string; userAgent: string } {
    return {
      ipAddress: 'client_ip', // In production, get from request headers
      userAgent: navigator.userAgent,
    };
  }

  // Validate user permissions for PHI access
  validatePHIAccess(userRole: string, action: string): boolean {
    const permissions = {
      admin: ['view', 'create', 'update', 'delete', 'export', 'print'],
      staff: ['view', 'create', 'update', 'export'],
      manager: ['view', 'export', 'print'],
      user: ['view'],
    };

    const allowedActions = permissions[userRole as keyof typeof permissions] || [];
    return allowedActions.includes(action);
  }
}

export default HIPAAComplianceService;
