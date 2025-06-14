
-- Create function to insert HIPAA audit logs
CREATE OR REPLACE FUNCTION public.insert_hipaa_audit_log(
  p_user_id text,
  p_action text,
  p_resource_type text,
  p_resource_id text,
  p_ip_address text,
  p_user_agent text,
  p_success boolean,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.hipaa_audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    ip_address,
    user_agent,
    success,
    error_message
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_ip_address,
    p_user_agent,
    p_success,
    p_error_message
  );
END;
$$;

-- Create function to get HIPAA audit logs with filters
CREATE OR REPLACE FUNCTION public.get_hipaa_audit_logs(
  p_user_id text DEFAULT NULL,
  p_resource_type text DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_start_date text DEFAULT NULL,
  p_end_date text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id text,
  action text,
  resource_type text,
  resource_id text,
  ip_address text,
  user_agent text,
  timestamp timestamptz,
  success boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.user_id,
    h.action,
    h.resource_type,
    h.resource_id,
    h.ip_address,
    h.user_agent,
    h.timestamp,
    h.success,
    h.error_message
  FROM public.hipaa_audit_logs h
  WHERE 
    (p_user_id IS NULL OR h.user_id = p_user_id)
    AND (p_resource_type IS NULL OR h.resource_type = p_resource_type)
    AND (p_action IS NULL OR h.action = p_action)
    AND (p_start_date IS NULL OR h.timestamp >= p_start_date::timestamptz)
    AND (p_end_date IS NULL OR h.timestamp <= p_end_date::timestamptz)
  ORDER BY h.timestamp DESC;
END;
$$;
