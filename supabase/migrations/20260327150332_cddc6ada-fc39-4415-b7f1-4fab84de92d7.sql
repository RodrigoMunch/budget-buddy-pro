
-- Set admin users to premium without expiration
UPDATE profiles SET plan = 'premium', plan_expires_at = NULL
WHERE user_id IN (SELECT user_id FROM user_roles WHERE role = 'admin');
