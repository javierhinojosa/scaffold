-- Create enum for admin roles
CREATE TYPE admin_role AS ENUM ('admin', 'super_admin');

-- Create admin users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role admin_role NOT NULL DEFAULT 'admin',
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create RLS policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy for super_admins (can do everything)
CREATE POLICY "super_admins_can_do_everything" ON admin_users
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE role = 'super_admin'
    )
  );

-- Policy for admins (can only read)
CREATE POLICY "admins_can_read" ON admin_users
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE role = 'admin'
    )
  );

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX admin_users_user_id_idx ON admin_users(user_id);
CREATE INDEX admin_users_role_idx ON admin_users(role);

-- Grant necessary permissions
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO service_role; 