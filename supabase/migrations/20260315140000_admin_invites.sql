-- Admin invite codes table
CREATE TABLE IF NOT EXISTS admin_invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  used_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  used_at timestamptz,
  is_active boolean DEFAULT true NOT NULL,
  label text
);

ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;

-- Anyone can read active unused invite codes (needed for registration validation)
CREATE POLICY "Public can read active invite codes"
  ON admin_invites FOR SELECT
  USING (is_active = true AND used_by IS NULL);

-- Admins can read ALL invite codes (including used/revoked)
CREATE POLICY "Admins can read all invite codes"
  ON admin_invites FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can create invite codes
CREATE POLICY "Admins can create invite codes"
  ON admin_invites FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update invite codes (revoke)
CREATE POLICY "Admins can update invite codes"
  ON admin_invites FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete invite codes
CREATE POLICY "Admins can delete invite codes"
  ON admin_invites FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated users can mark a code as used (during registration)
CREATE POLICY "Authenticated users can mark invite as used"
  ON admin_invites FOR UPDATE
  USING (is_active = true AND used_by IS NULL)
  WITH CHECK (used_by = auth.uid());
