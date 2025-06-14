
-- Create HIPAA audit logs table
CREATE TABLE public.hipaa_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'create', 'update', 'delete', 'export', 'print')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('verification', 'prior_auth', 'patient_data')),
  resource_id TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.hipaa_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all audit logs
CREATE POLICY "Admins can view all audit logs" 
  ON public.hipaa_audit_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy for users to view their own audit logs
CREATE POLICY "Users can view their own audit logs" 
  ON public.hipaa_audit_logs 
  FOR SELECT 
  USING (user_id = auth.uid()::text);

-- Create policy for system to insert audit logs
CREATE POLICY "System can insert audit logs" 
  ON public.hipaa_audit_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_hipaa_audit_logs_user_id ON public.hipaa_audit_logs(user_id);
CREATE INDEX idx_hipaa_audit_logs_timestamp ON public.hipaa_audit_logs(timestamp);
CREATE INDEX idx_hipaa_audit_logs_resource ON public.hipaa_audit_logs(resource_type, resource_id);
