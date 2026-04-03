
-- 1. Fix get_user_by_email: add server-side admin check
CREATE OR REPLACE FUNCTION public.get_user_by_email(_email text)
RETURNS TABLE(user_id uuid, name text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id AS user_id, p.name, u.email
  FROM auth.users u
  JOIN public.profiles p ON p.user_id = u.id
  WHERE u.email = _email
    AND public.has_role(auth.uid(), 'admin');
$$;

-- 2. Fix profiles UPDATE policy: only allow updating name and total_limit
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND plan = (SELECT p.plan FROM profiles p WHERE p.user_id = auth.uid())
    AND trial_used = (SELECT p.trial_used FROM profiles p WHERE p.user_id = auth.uid())
    AND plan_expires_at IS NOT DISTINCT FROM (SELECT p.plan_expires_at FROM profiles p WHERE p.user_id = auth.uid())
    AND plan_started_at IS NOT DISTINCT FROM (SELECT p.plan_started_at FROM profiles p WHERE p.user_id = auth.uid())
  );

-- 3. Fix user_roles: add restrictive policy to prevent self-role-assignment
CREATE POLICY "Prevent self admin assignment" ON user_roles
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id != auth.uid() OR role = 'user'::app_role
  );
