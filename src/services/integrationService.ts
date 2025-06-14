
import { VerificationResult } from '@/pages/Index';
import FHIRService from './fhirService';
import NotificationService from './notificationService';

export interface IntegrationConfig {
  fhir: {
    enabled: boolean;
    baseUrl: string;
    apiKey: string;
  };
  notifications: {
    emailEnabled: boolean;
    slackEnabled: boolean;
    slackWebhookUrl?: string;
    emailRecipients: string[];
  };
}

class IntegrationService {
  private fhirService?: FHIRService;
  private notificationService: NotificationService;
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
    
    if (config.fhir.enabled && config.fhir.baseUrl && config.fhir.apiKey) {
      this.fhirService = new FHIRService(config.fhir.baseUrl, config.fhir.apiKey);
    }
    
    this.notificationService = new NotificationService(config.notifications);
  }

  async processVerificationResult(verification: VerificationResult): Promise<void> {
    console.log('Processing verification result for integrations:', verification.id);

    try {
      // Handle different verification statuses
      switch (verification.status) {
        case 'eligible':
          await this.handleEligibleResult(verification);
          break;
        case 'ineligible':
        case 'requires_auth':
        case 'error':
          await this.handleActionRequiredResult(verification);
          break;
      }
    } catch (error) {
      console.error('Error processing verification result:', error);
      // Don't throw error to avoid breaking the main verification flow
    }
  }

  private async handleEligibleResult(verification: VerificationResult): Promise<void> {
    const promises: Promise<void>[] = [];

    // Update EHR via FHIR if enabled
    if (this.fhirService) {
      promises.push(this.updateEHRRecord(verification));
    }

    // Send patient confirmation
    promises.push(this.notificationService.sendPatientConfirmation(verification));

    // Log the successful verification
    console.log(`✅ Patient ${verification.patient.firstName} ${verification.patient.lastName} verified as eligible`);

    await Promise.allSettled(promises);
  }

  private async handleActionRequiredResult(verification: VerificationResult): Promise<void> {
    // Send staff notification for manual follow-up
    await this.notificationService.sendStaffNotification(verification);
    
    console.log(`⚠️ Manual action required for ${verification.patient.firstName} ${verification.patient.lastName} - Status: ${verification.status}`);
  }

  private async updateEHRRecord(verification: VerificationResult): Promise<void> {
    if (!this.fhirService) {
      console.warn('FHIR service not configured, skipping EHR update');
      return;
    }

    try {
      console.log('Updating EHR record via FHIR for:', verification.patient.firstName, verification.patient.lastName);
      
      // Create or update patient record
      const patient = await this.fhirService.createOrUpdatePatient(verification.patient);
      console.log('Patient record created/updated:', patient.id);
      
      // Create or update coverage record
      if (patient.id) {
        const coverage = await this.fhirService.createOrUpdateCoverage(patient.id, verification);
        console.log('Coverage record created/updated:', coverage.id);
      }
      
      console.log('✅ EHR record successfully updated via FHIR');
    } catch (error) {
      console.error('Failed to update EHR record:', error);
      throw error;
    }
  }

  // Method to test integrations
  async testIntegrations(): Promise<{ fhir: boolean; notifications: boolean }> {
    const results = { fhir: false, notifications: false };

    // Test FHIR connection
    if (this.fhirService) {
      try {
        // Try to make a simple request to test connectivity
        await this.fhirService.createOrUpdatePatient({
          firstName: 'Test',
          lastName: 'Patient',
          dob: '1990-01-01',
        });
        results.fhir = true;
      } catch (error) {
        console.error('FHIR integration test failed:', error);
      }
    }

    // Test notifications (this would be more complex in real implementation)
    results.notifications = this.config.notifications.emailEnabled || this.config.notifications.slackEnabled;

    return results;
  }
}

export default IntegrationService;
