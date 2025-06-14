
-- Fix potential RLS policy warnings by ensuring proper indexes and constraints

-- Ensure foreign key constraints are properly indexed for performance
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id 
ON public.verification_requests(user_id);

-- Add missing constraints that might cause warnings
ALTER TABLE public.verification_requests 
ADD CONSTRAINT verification_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Update RLS policies to be more specific and avoid potential recursion warnings
DROP POLICY IF EXISTS "Allow public insert on verification_requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Allow public select on verification_requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Allow public update on verification_requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Allow public delete on verification_requests" ON public.verification_requests;

-- Create more secure RLS policies
CREATE POLICY "Users can view their own verification requests" 
ON public.verification_requests 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create verification requests" 
ON public.verification_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own verification requests" 
ON public.verification_requests 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own verification requests" 
ON public.verification_requests 
FOR DELETE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Fix HIPAA audit logs RLS policies to avoid warnings
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.hipaa_audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.hipaa_audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.hipaa_audit_logs;

-- Create a security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_uuid;
$$;

-- Recreate HIPAA audit log policies with proper structure
CREATE POLICY "Admins can view all audit logs" 
ON public.hipaa_audit_logs 
FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view their own audit logs" 
ON public.hipaa_audit_logs 
FOR SELECT 
USING (user_id = auth.uid()::text OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Authenticated users can insert audit logs" 
ON public.hipaa_audit_logs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Add proper constraints to prevent data integrity warnings
ALTER TABLE public.hipaa_audit_logs 
ADD CONSTRAINT hipaa_audit_logs_action_check 
CHECK (action IN ('view', 'create', 'update', 'delete', 'export', 'print'));

ALTER TABLE public.hipaa_audit_logs 
ADD CONSTRAINT hipaa_audit_logs_resource_type_check 
CHECK (resource_type IN ('verification', 'prior_auth', 'patient_data'));

-- Ensure profiles table has proper constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'staff', 'manager', 'user'));

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_verification_requests_updated_at 
BEFORE UPDATE ON public.verification_requests 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON public.profiles 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
