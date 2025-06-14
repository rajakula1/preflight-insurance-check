
-- Add member_id column to verification_requests table
ALTER TABLE public.verification_requests 
ADD COLUMN IF NOT EXISTS member_id TEXT;

-- Add subscriber_name column to verification_requests table  
ALTER TABLE public.verification_requests 
ADD COLUMN IF NOT EXISTS subscriber_name TEXT;

-- Update the status check constraint to include all possible statuses
ALTER TABLE public.verification_requests 
DROP CONSTRAINT IF EXISTS verification_requests_status_check;

ALTER TABLE public.verification_requests 
ADD CONSTRAINT verification_requests_status_check 
CHECK (status IN ('pending', 'eligible', 'ineligible', 'requires_auth', 'error', 'verified', 'failed', 'requires_review'));

-- Create an index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_verification_requests_created_at 
ON public.verification_requests(created_at DESC);

-- Create an index on status for filtering
CREATE INDEX IF NOT EXISTS idx_verification_requests_status 
ON public.verification_requests(status);
