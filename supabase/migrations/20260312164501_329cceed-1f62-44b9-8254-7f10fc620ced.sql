CREATE TABLE public.call_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_id uuid NOT NULL,
  service_name text NOT NULL,
  service_phone text NOT NULL,
  service_category text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own calls"
ON public.call_history FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own calls"
ON public.call_history FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all calls"
ON public.call_history FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));