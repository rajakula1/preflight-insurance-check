
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientData } = await req.json();
    console.log('AI verification started for patient:', patientData);

    // Create the AI prompt for insurance verification
    const aiPrompt = `You are an expert insurance verification AI agent. Analyze the following patient insurance information and provide a comprehensive verification assessment.

Patient Information:
- Name: ${patientData.firstName} ${patientData.lastName}
- Date of Birth: ${patientData.dob}
- Insurance Company: ${patientData.insuranceCompany}
- Policy Number: ${patientData.policyNumber}
- Group Number: ${patientData.groupNumber || 'Not provided'}
- Member ID: ${patientData.memberID}
- Subscriber Name: ${patientData.subscriberName || 'Same as patient'}

Please analyze this information and provide:
1. Verification status (eligible, ineligible, requires_auth, or error)
2. Coverage details including active status, in-network status, copay, deductible
3. Whether prior authorization is required
4. Any potential issues or red flags
5. Recommended next steps

Be realistic in your assessment based on common insurance verification scenarios. Consider factors like:
- Completeness of information provided
- Common insurance company patterns
- Typical coverage scenarios
- Potential verification challenges

Respond in the following JSON format:
{
  "status": "eligible|ineligible|requires_auth|error",
  "coverage": {
    "active": boolean,
    "effectiveDate": "YYYY-MM-DD or null",
    "terminationDate": "YYYY-MM-DD or null", 
    "copay": number or null,
    "deductible": number or null,
    "inNetwork": boolean,
    "priorAuthRequired": boolean
  },
  "reasoning": "Detailed explanation of the verification decision",
  "recommendations": ["array", "of", "next", "steps"],
  "additionalQuestions": ["questions", "to", "ask", "patient", "if", "needed"]
}`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert insurance verification specialist with years of experience in healthcare insurance eligibility verification. Provide accurate, professional assessments.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices[0].message.content;
    
    console.log('AI response received:', aiContent);

    // Parse AI response
    let verificationResult;
    try {
      verificationResult = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback result
      verificationResult = {
        status: 'error',
        coverage: {
          active: false,
          effectiveDate: null,
          terminationDate: null,
          copay: null,
          deductible: null,
          inNetwork: false,
          priorAuthRequired: false
        },
        reasoning: 'AI analysis failed to parse properly',
        recommendations: ['Manual verification required', 'Contact insurance provider directly'],
        additionalQuestions: []
      };
    }

    // Store the verification request in the database
    const { data: dbData, error: dbError } = await supabase
      .from('verification_requests')
      .insert({
        patient_first_name: patientData.firstName,
        patient_last_name: patientData.lastName,
        patient_dob: patientData.dob,
        insurance_company: patientData.insuranceCompany,
        policy_number: patientData.policyNumber,
        group_number: patientData.groupNumber || null,
        member_id: patientData.memberID,
        subscriber_name: patientData.subscriberName || null,
        status: verificationResult.status,
        verification_result: {
          ...verificationResult.coverage,
          aiReasoning: verificationResult.reasoning,
          recommendations: verificationResult.recommendations,
          additionalQuestions: verificationResult.additionalQuestions
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('Verification stored in database:', dbData);

    // Transform the result to match frontend expectations
    const finalResult = {
      id: dbData.id,
      timestamp: dbData.created_at,
      patient: patientData,
      status: verificationResult.status,
      coverage: verificationResult.coverage,
      aiInsights: {
        reasoning: verificationResult.reasoning,
        recommendations: verificationResult.recommendations,
        additionalQuestions: verificationResult.additionalQuestions
      },
      nextSteps: verificationResult.recommendations
    };

    return new Response(JSON.stringify(finalResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI insurance verification:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      status: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
