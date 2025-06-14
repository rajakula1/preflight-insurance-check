
# Healthcare Insurance Verification System

## Project info

**URL**: https://lovable.dev/projects/4a4198c5-ff20-404f-a83e-cf254b7e03e6

## Overview

A comprehensive healthcare insurance verification system built with React, TypeScript, and Supabase. This application provides AI-powered insurance verification, prior authorization management, and HIPAA-compliant audit logging for healthcare providers.

## Key Features

### 🔍 AI-Powered Insurance Verification
- **Automated Verification**: Uses AI (Gemini) to verify patient insurance eligibility in real-time
- **Multiple Insurance Providers**: Supports verification across various insurance companies
- **Intelligent Status Detection**: Automatically determines coverage status (eligible, ineligible, requires authorization)
- **Smart Recommendations**: Provides next steps and actionable insights based on verification results

### 🏥 Prior Authorization Management
- **Automated Prior Auth Requests**: Streamlined submission of prior authorization requests
- **Clinical Justification**: Built-in forms for medical necessity documentation
- **Urgency Levels**: Support for routine, urgent, and STAT authorization requests
- **Real-time Status Tracking**: Monitor authorization status and approval workflow

### 🔒 HIPAA Compliance & Security
- **Comprehensive Audit Logging**: All PHI access and modifications are automatically logged with enhanced security
- **Data Masking**: Sensitive information is masked by default with reveal-on-demand
- **Role-Based Access Control**: Advanced permissions for different user types (admin, staff, manager, user)
- **Data Retention Policies**: Automated enforcement of HIPAA-required data retention periods (7 years)
- **Enhanced Security Functions**: Security definer functions prevent RLS policy recursion
- **Data Integrity Constraints**: Comprehensive validation rules for all sensitive data
- **Automatic Timestamp Updates**: Triggers ensure accurate audit trails for all modifications
- **Compliance Monitoring**: Real-time compliance status tracking and violation detection

### 📊 Analytics & Reporting
- **Compliance Reports**: Generate detailed HIPAA compliance reports
- **Audit Trail Analysis**: Track unauthorized access attempts and data exports
- **Performance Metrics**: Monitor verification success rates and processing times
- **Data Retention Monitoring**: Identify records exceeding retention periods

### 🔗 Healthcare Integrations
- **FHIR Compatibility**: Ready for FHIR-compliant data exchange
- **EHR Integration**: Designed to integrate with Electronic Health Record systems
- **Notification Services**: Email and Slack notifications for critical events
- **Real-time Sync**: Automatic data synchronization across healthcare systems

## Security Features

### Enhanced HIPAA Audit Logging
- **Granular Tracking**: Every view, create, update, delete, export, and print action is logged
- **IP Address Tracking**: Records client IP and user agent for security analysis
- **Error Logging**: Captures failed access attempts for security monitoring
- **Timestamp Precision**: All actions timestamped with timezone awareness
- **Automated Triggers**: Database triggers ensure consistent audit trail maintenance
- **Constraint Validation**: Built-in data integrity checks prevent invalid audit entries

### Advanced Data Protection
- **PHI Masking**: Automatic masking of SSN, policy numbers, phone numbers, and email addresses
- **Secure Components**: HIPAA-compliant wrapper components for sensitive data display
- **Access Validation**: Real-time permission checking before displaying PHI
- **Encryption Ready**: Built-in support for AES-256 encryption (production-ready)
- **Foreign Key Constraints**: Proper referential integrity with CASCADE options
- **Performance Optimization**: Strategic indexing for audit log queries

### Enhanced User Access Control
- **Role-Based Permissions**: 
  - Admin: Full access to all functions
  - Staff: View, create, update, export permissions
  - Manager: View, export, print permissions
  - User: View-only access
- **Real-time Validation**: Permissions checked on every sensitive operation
- **Security Definer Functions**: Prevent RLS policy recursion and enhance security
- **Role Validation**: Database-level constraints ensure valid user roles

## Technical Architecture

### Frontend Technologies
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and building
- **Tailwind CSS** for responsive, utility-first styling
- **shadcn/ui** for consistent, accessible UI components
- **React Query** for efficient data fetching and caching
- **React Router** for client-side routing

### Backend & Database
- **Supabase** for backend-as-a-service with enhanced configuration
- **PostgreSQL** for robust, ACID-compliant data storage
- **Enhanced Row Level Security (RLS)** for database-level access control
- **Security Definer Functions** for safe role checking without recursion
- **Edge Functions** for serverless AI processing
- **Real-time Subscriptions** for live data updates
- **Connection Pooling** for optimized database performance
- **Query Timeouts** to prevent long-running operations

### AI & External Services
- **Google Gemini AI** for intelligent insurance verification
- **FHIR Integration** (configurable) for healthcare data standards
- **Email/Slack Notifications** for workflow automation

## Database Schema

### Core Tables
- `verification_requests`: Stores insurance verification data and results with enhanced constraints
- `hipaa_audit_logs`: Comprehensive audit trail for all PHI access with validation rules
- `profiles`: User profile and role management with role constraints

### Enhanced Security Functions
- `insert_hipaa_audit_log()`: Secure audit log insertion with SECURITY DEFINER
- `get_hipaa_audit_logs()`: Filtered audit log retrieval with enhanced RLS
- `get_user_role()`: Safe role checking function preventing RLS recursion
- `update_updated_at_column()`: Automatic timestamp maintenance trigger
- `handle_new_user()`: Automatic profile creation on user signup

### Database Enhancements
- **Foreign Key Constraints**: Proper CASCADE relationships for data integrity
- **Check Constraints**: Validation rules for actions, resource types, and user roles
- **Performance Indexes**: Optimized queries for user_id, timestamp, and resource lookups
- **Automatic Triggers**: Timestamp maintenance for verification requests and profiles

## Getting Started

### Prerequisites
- Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Supabase account for backend services
- Google Gemini API key for AI verification

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start development server
npm run dev
```

### Environment Setup
1. Create a Supabase project
2. Run the provided SQL migrations in your Supabase dashboard
3. Set up the following secrets in your Supabase project:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `OPENAI_API_KEY`: OpenAI API key (optional, for additional AI features)

### Database Setup
Execute the following migrations in your Supabase SQL editor:
1. `20250614191328-9e1e3f19-5657-4d2a-8172-a74b582bff5c.sql` - Creates HIPAA audit logs table
2. `20250614195000_create_hipaa_functions.sql` - Creates HIPAA audit functions
3. `20250614200000_fix_supabase_warnings.sql` - Enhanced security and performance fixes

## Usage

### Insurance Verification Workflow
1. **Patient Data Entry**: Input patient demographics and insurance information
2. **AI Verification**: System automatically verifies coverage using AI
3. **Results Review**: Review verification status and AI-generated insights
4. **Action Items**: Follow recommended next steps based on verification results

### Prior Authorization Process
1. **Initiate Request**: Start from verification results requiring authorization
2. **Clinical Documentation**: Provide medical necessity justification
3. **Submission**: Automated submission to insurance provider
4. **Tracking**: Monitor authorization status and approval timeline

### HIPAA Compliance Monitoring
1. **Automatic Logging**: All PHI access is automatically logged with enhanced security
2. **Compliance Dashboard**: Monitor compliance status and violations
3. **Audit Reports**: Generate detailed compliance reports for review
4. **Data Retention**: Automated enforcement of retention policies

## Deployment

### Lovable Platform
Simply click the **Publish** button in the top right of the Lovable editor to deploy your application.

### Custom Domain
Connect a custom domain by navigating to Project > Settings > Domains in Lovable (requires paid plan).

## Security Considerations

### Production Deployment
- Replace placeholder encryption with AES-256 encryption
- Implement proper IP address detection for audit logs
- Set up secure environment variable management
- Configure SSL/TLS certificates for data in transit
- Implement backup and disaster recovery procedures
- Review and test all database constraints and triggers

### Enhanced Compliance Requirements
- Regular audit log reviews and compliance assessments
- Staff training on HIPAA requirements and system usage
- Incident response procedures for security breaches
- Regular security vulnerability assessments
- Database performance monitoring and optimization
- Validation of all constraint rules and security policies

## Recent Enhancements

### Version 2.0 Security & Performance Updates
- **Enhanced RLS Policies**: Improved Row Level Security with security definer functions
- **Database Constraints**: Comprehensive validation rules for data integrity
- **Performance Optimization**: Strategic indexing and connection pooling
- **Automated Triggers**: Consistent timestamp maintenance across all tables
- **Configuration Hardening**: Enhanced Supabase configuration for production use
- **Warning Resolution**: Fixed all potential Supabase warnings and performance issues

## Support & Documentation

- **Lovable Documentation**: [docs.lovable.dev](https://docs.lovable.dev/)
- **Discord Community**: [Lovable Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)
- **Video Tutorials**: [YouTube Playlist](https://www.youtube.com/watch?v=9KHLTZaJcR8&list=PLbVHz4urQBZkJiAWdG8HWoJTdgEysigIO)

## License

This project is built for healthcare providers and must comply with HIPAA regulations. Ensure proper security measures and compliance procedures are in place before handling real patient data.

## Contributing

When contributing to this project, please ensure:
- All new features maintain HIPAA compliance
- PHI handling follows established security patterns
- Audit logging is implemented for any new data access
- Changes are tested for security vulnerabilities
- Database migrations include proper constraints and indexes
- RLS policies use security definer functions when needed

---

**Important**: This system handles Protected Health Information (PHI). Ensure all deployment and usage complies with HIPAA regulations and your organization's security policies.
