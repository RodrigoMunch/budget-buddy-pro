
-- Add plan fields to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_used boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_started_at timestamptz DEFAULT NULL;

-- Add constraint to ensure valid plan values
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'premium'));

-- Update the handle_new_user trigger to set trial for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, plan, plan_started_at, trial_used, plan_expires_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    'premium',
    now(),
    false,
    now() + interval '7 days'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;
