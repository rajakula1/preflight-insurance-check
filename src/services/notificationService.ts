
import { VerificationResult } from '@/pages/Index';

export interface NotificationConfig {
  emailEnabled: boolean;
  slackEnabled: boolean;
  slackWebhookUrl?: string;
  emailRecipients: string[];
}

export interface NotificationData {
  type: 'staff_alert' | 'patient_confirmation';
  verification: VerificationResult;
  message: string;
  urgency: 'low' | 'medium' | 'high';
}

class NotificationService {
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
  }

  async sendStaffNotification(verification: VerificationResult): Promise<void> {
    const notificationData: NotificationData = {
      type: 'staff_alert',
      verification,
      message: this.generateStaffMessage(verification),
      urgency: this.determineUrgency(verification.status),
    };

    const promises: Promise<void>[] = [];

    if (this.config.emailEnabled && this.config.emailRecipients.length > 0) {
      promises.push(this.sendEmailNotification(notificationData));
    }

    if (this.config.slackEnabled && this.config.slackWebhookUrl) {
      promises.push(this.sendSlackNotification(notificationData));
    }

    await Promise.allSettled(promises);
  }

  async sendPatientConfirmation(verification: VerificationResult): Promise<void> {
    const notificationData: NotificationData = {
      type: 'patient_confirmation',
      verification,
      message: this.generatePatientMessage(verification),
      urgency: 'low',
    };

    if (this.config.emailEnabled) {
      await this.sendEmailNotification(notificationData);
    }
  }

  private async sendEmailNotification(data: NotificationData): Promise<void> {
    try {
      // This would typically call your email service edge function
      const response = await fetch('/api/send-notification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: data.type,
          recipients: data.type === 'staff_alert' ? this.config.emailRecipients : [data.verification.patient.firstName],
          subject: this.getEmailSubject(data),
          message: data.message,
          verification: data.verification,
        }),
      });

      if (!response.ok) {
        throw new Error(`Email notification failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  private async sendSlackNotification(data: NotificationData): Promise<void> {
    if (!this.config.slackWebhookUrl) return;

    try {
      const slackMessage = {
        text: `Insurance Verification Alert`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🏥 Insurance Verification Alert - ${data.urgency.toUpperCase()}`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Patient:* ${data.verification.patient.firstName} ${data.verification.patient.lastName}`,
              },
              {
                type: 'mrkdwn',
                text: `*Status:* ${data.verification.status.replace('_', ' ').toUpperCase()}`,
              },
              {
                type: 'mrkdwn',
                text: `*Insurance:* ${data.verification.patient.insuranceCompany}`,
              },
              {
                type: 'mrkdwn',
                text: `*Policy:* ${data.verification.patient.policyNumber}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Action Required:*\n${data.message}`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View Details',
                },
                url: `${window.location.origin}/?verification=${data.verification.id}`,
              },
            ],
          },
        ],
      };

      const response = await fetch(this.config.slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slackMessage),
      });

      if (!response.ok) {
        throw new Error(`Slack notification failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  private generateStaffMessage(verification: VerificationResult): string {
    const patient = `${verification.patient.firstName} ${verification.patient.lastName}`;
    
    switch (verification.status) {
      case 'ineligible':
        return `⚠️ Patient ${patient} has ineligible insurance coverage. Contact patient about payment options and coverage verification.`;
      case 'requires_auth':
        return `📋 Prior authorization required for ${patient}. Please initiate authorization process with ${verification.patient.insuranceCompany}.`;
      case 'error':
        return `❌ Verification failed for ${patient}. Manual verification required. Check patient information and retry.`;
      default:
        return `ℹ️ Manual review needed for ${patient}.`;
    }
  }

  private generatePatientMessage(verification: VerificationResult): string {
    const patient = verification.patient.firstName;
    
    if (verification.status === 'eligible') {
      return `Good news ${patient}! Your insurance verification is complete and your appointment is confirmed. We'll see you soon!`;
    }
    
    return `Hello ${patient}, we need to discuss your insurance coverage. Please contact our office at your earliest convenience.`;
  }

  private determineUrgency(status: VerificationResult['status']): 'low' | 'medium' | 'high' {
    switch (status) {
      case 'error':
        return 'high';
      case 'ineligible':
        return 'high';
      case 'requires_auth':
        return 'medium';
      default:
        return 'low';
    }
  }

  private getEmailSubject(data: NotificationData): string {
    if (data.type === 'patient_confirmation') {
      return `Appointment Confirmation - ${data.verification.patient.firstName} ${data.verification.patient.lastName}`;
    }
    
    return `Insurance Verification Alert - ${data.verification.status.replace('_', ' ').toUpperCase()}`;
  }
}

export default NotificationService;
