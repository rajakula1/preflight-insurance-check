
-- Enable Row Level Security on verification_requests table (if not already enabled)
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert verification requests (since no auth is implemented yet)
CREATE POLICY "Allow public insert on verification_requests" 
ON public.verification_requests 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow anyone to select verification requests
CREATE POLICY "Allow public select on verification_requests" 
ON public.verification_requests 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to update verification requests
CREATE POLICY "Allow public update on verification_requests" 
ON public.verification_requests 
FOR UPDATE 
USING (true);

-- Create policy to allow anyone to delete verification requests
CREATE POLICY "Allow public delete on verification_requests" 
ON public.verification_requests 
FOR DELETE 
USING (true);
