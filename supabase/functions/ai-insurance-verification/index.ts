
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Retry function for Gemini API calls with better error handling
async function callGeminiWithRetry(payload: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini API attempt ${attempt}/${maxRetries}`);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        // Rate limited - wait before retry
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`);
        
        if (attempt === maxRetries) {
          throw new Error('Gemini API rate limit exceeded. Please try again in a few minutes.');
        }
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error (${response.status}):`, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Validate the response structure for Gemini
      if (!result || !result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0]) {
        console.error('Invalid Gemini response structure:', result);
        throw new Error('Invalid response from Gemini API');
      }

      return result;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientData } = await req.json();
    console.log('AI verification started for patient:', patientData);

    // Validate required fields
    if (!patientData || !patientData.firstName || !patientData.lastName || !patientData.insuranceCompany) {
      throw new Error('Missing required patient data fields');
    }

    // Check if Gemini API key is configured
    if (!geminiApiKey) {
      console.error('Gemini API key not configured');
      throw new Error('AI service not configured. Please contact administrator.');
    }

    // Create a more focused AI prompt for insurance verification
    const aiPrompt = `You are an expert insurance verification specialist. Analyze this patient insurance information and provide a realistic verification assessment.

Patient: ${patientData.firstName} ${patientData.lastName}
DOB: ${patientData.dob}
Insurance: ${patientData.insuranceCompany}
Policy: ${patientData.policyNumber}
Member ID: ${patientData.memberID}
${patientData.groupNumber ? `Group: ${patientData.groupNumber}` : ''}
${patientData.subscriberName ? `Subscriber: ${patientData.subscriberName}` : ''}

Provide a verification assessment with these considerations:
- Information completeness and validity
- Common insurance verification scenarios
- Realistic coverage details based on the insurance company
- Potential issues or requirements

Respond ONLY with valid JSON in this exact format:
{
  "status": "eligible|ineligible|requires_auth|error",
  "coverage": {
    "active": boolean,
    "effectiveDate": "YYYY-MM-DD or null",
    "terminationDate": "YYYY-MM-DD or null",
    "copay": number_or_null,
    "deductible": number_or_null,
    "inNetwork": boolean,
    "priorAuthRequired": boolean
  },
  "reasoning": "Brief explanation of verification decision",
  "recommendations": ["action1", "action2"],
  "additionalQuestions": ["question1_if_needed"]
}`;

    let verificationResult;
    
    try {
      // Call Gemini API with retry logic
      const aiResponse = await callGeminiWithRetry({
        contents: [
          {
            parts: [
              {
                text: aiPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        }
      });

      const aiContent = aiResponse.candidates[0].content.parts[0].text;
      console.log('AI response received:', aiContent);

      // Parse AI response with better error handling
      try {
        // Clean the response to ensure it's valid JSON
        const cleanedContent = aiContent.trim().replace(/```json\n?|\n?```/g, '');
        verificationResult = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('Raw AI content:', aiContent);
        throw new Error('AI response could not be parsed properly');
      }

      // Validate the parsed result structure
      if (!verificationResult.status || !verificationResult.coverage || !verificationResult.reasoning) {
        console.error('Invalid AI response structure:', verificationResult);
        throw new Error('AI response was incomplete or invalid');
      }

    } catch (aiError) {
      console.error('AI verification failed:', aiError);
      
      // Provide a fallback result when AI fails
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
        reasoning: `AI verification temporarily unavailable: ${aiError.message}. Manual verification recommended.`,
        recommendations: ['Contact insurance provider directly', 'Verify patient information manually', 'Retry verification later'],
        additionalQuestions: ['Please confirm all insurance details are correct']
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
          recommendations: verificationResult.recommendations || [],
          additionalQuestions: verificationResult.additionalQuestions || []
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
        recommendations: verificationResult.recommendations || [],
        additionalQuestions: verificationResult.additionalQuestions || []
      },
      nextSteps: verificationResult.recommendations || []
    };

    return new Response(JSON.stringify(finalResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI insurance verification:', error);
    
    // Return a structured error response
    const errorResponse = {
      error: error.message,
      status: 'error',
      details: 'Please check the function logs for more information'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
