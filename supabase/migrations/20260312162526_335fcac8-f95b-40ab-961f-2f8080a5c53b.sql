ALTER TABLE public.profiles 
ADD COLUMN subscription_active boolean NOT NULL DEFAULT false,
ADD COLUMN subscription_expires_at timestamp with time zone DEFAULT NULL;