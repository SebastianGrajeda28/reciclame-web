-- Add registration_method column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_method TEXT NOT NULL DEFAULT 'web';

-- Create index on registration_method for faster queries
CREATE INDEX IF NOT EXISTS idx_users_registration_method ON users(registration_method);

-- Update existing records to have 'sysadmin' as default for admin accounts
UPDATE users 
SET registration_method = 'sysadmin' 
WHERE registration_method = 'web' AND id IN (
  SELECT user_id FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE r.name = 'admin' AND ur.is_active = true
);
