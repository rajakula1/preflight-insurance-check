
export interface FHIRPatient {
  resourceType: 'Patient';
  id?: string;
  identifier: Array<{
    use: string;
    system: string;
    value: string;
  }>;
  name: Array<{
    use: string;
    family: string;
    given: string[];
  }>;
  birthDate: string;
  address?: Array<{
    use: string;
    line: string[];
    city: string;
    state: string;
    postalCode: string;
  }>;
}

export interface FHIRCoverage {
  resourceType: 'Coverage';
  id?: string;
  status: 'active' | 'cancelled' | 'draft' | 'entered-in-error';
  subscriber: {
    reference: string;
  };
  beneficiary: {
    reference: string;
  };
  payor: Array<{
    display: string;
  }>;
  class?: Array<{
    type: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    value: string;
  }>;
  period?: {
    start: string;
    end?: string;
  };
}

class FHIRService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', data?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FHIR API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async createOrUpdatePatient(patientData: any): Promise<FHIRPatient> {
    const fhirPatient: FHIRPatient = {
      resourceType: 'Patient',
      identifier: [
        {
          use: 'usual',
          system: 'http://hospital.smarthealthit.org',
          value: `${patientData.firstName}-${patientData.lastName}-${patientData.dob}`,
        },
      ],
      name: [
        {
          use: 'official',
          family: patientData.lastName,
          given: [patientData.firstName],
        },
      ],
      birthDate: patientData.dob,
    };

    return await this.makeRequest('/Patient', 'POST', fhirPatient);
  }

  async createOrUpdateCoverage(patientId: string, verificationResult: any): Promise<FHIRCoverage> {
    const coverage: FHIRCoverage = {
      resourceType: 'Coverage',
      status: verificationResult.coverage.active ? 'active' : 'cancelled',
      subscriber: {
        reference: `Patient/${patientId}`,
      },
      beneficiary: {
        reference: `Patient/${patientId}`,
      },
      payor: [
        {
          display: verificationResult.patient.insuranceCompany,
        },
      ],
      class: [
        {
          type: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/coverage-class',
                code: 'group',
                display: 'Group',
              },
            ],
          },
          value: verificationResult.patient.groupNumber || 'N/A',
        },
        {
          type: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/coverage-class',
                code: 'plan',
                display: 'Plan',
              },
            ],
          },
          value: verificationResult.patient.policyNumber,
        },
      ],
    };

    if (verificationResult.coverage.effectiveDate) {
      coverage.period = {
        start: verificationResult.coverage.effectiveDate,
        end: verificationResult.coverage.terminationDate,
      };
    }

    return await this.makeRequest('/Coverage', 'POST', coverage);
  }
}

export default FHIRService;
