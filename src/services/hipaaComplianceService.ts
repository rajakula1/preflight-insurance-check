
import { supabase } from '@/integrations/supabase/client';

export interface HIPAAAuditLog {
  id?: string;
  userId: string;
  action: 'view' | 'create' | 'update' | 'delete' | 'export' | 'print';
  resourceType: 'verification' | 'prior_auth' | 'patient_data';
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

export interface DataRetentionPolicy {
  resourceType: string;
  retentionPeriodDays: number;
  autoDeleteEnabled: boolean;
}

class HIPAAComplianceService {
  private readonly ENCRYPTION_KEY = 'HIPAA_ENCRYPTION_KEY';
  private readonly AUDIT_TABLE = 'hipaa_audit_logs';
  
  // Data retention policies per HIPAA requirements
  private readonly retentionPolicies: DataRetentionPolicy[] = [
    { resourceType: 'verification_requests', retentionPeriodDays: 2555, autoDeleteEnabled: true }, // 7 years
    { resourceType: 'prior_auth_requests', retentionPeriodDays: 2555, autoDeleteEnabled: true }, // 7 years
    { resourceType: 'audit_logs', retentionPeriodDays: 2555, autoDeleteEnabled: false }, // 7 years, manual review
  ];

  async logAccess(auditData: Omit<HIPAAAuditLog, 'id' | 'timestamp' | 'ipAddress' | 'userAgent'>): Promise<void> {
    try {
      const clientInfo = this.getClientInfo();
      
      const auditLog: Omit<HIPAAAuditLog, 'id'> = {
        ...auditData,
        timestamp: new Date().toISOString(),
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      };

      const { error } = await supabase
        .from(this.AUDIT_TABLE)
        .insert(auditLog);

      if (error) {
        console.error('Failed to log HIPAA audit entry:', error);
        // In production, this should trigger an alert
      }
    } catch (error) {
      console.error('HIPAA audit logging error:', error);
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
      let query = supabase.from(this.AUDIT_TABLE).select('*');
      
      if (filters?.userId) {
        query = query.eq('userId', filters.userId);
      }
      if (filters?.resourceType) {
        query = query.eq('resourceType', filters.resourceType);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      const { data, error } = await query.order('timestamp', { ascending: false });
      
      if (error) {
        throw error;
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
        const { error } = await supabase
          .from(policy.resourceType)
          .delete()
          .lt('created_at', cutoffDate.toISOString());

        if (error) {
          console.error(`Data retention enforcement failed for ${policy.resourceType}:`, error);
          // Log this as a compliance issue
          await this.logAccess({
            userId: 'system',
            action: 'delete',
            resourceType: policy.resourceType as any,
            resourceId: 'bulk_retention_cleanup',
            success: false,
            errorMessage: error.message,
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
      
      const { data, error } = await supabase
        .from(policy.resourceType)
        .select('id, created_at')
        .lt('created_at', cutoffDate.toISOString());
      
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
