-- 1) Helper: ensure pgcrypto extension for gen_random_uuid if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Helper functions for auth integration ------------------------------------

-- Returns current user's UUID (auth.uid()) cast to uuid
CREATE OR REPLACE FUNCTION auth_uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT (auth.uid())::uuid;
$$ SECURITY DEFINER;
REVOKE EXECUTE ON FUNCTION auth_uid() FROM anon, authenticated;

-- Returns tenant_id (uuid) from JWT claim 'tenant_id'; NULL if missing
CREATE OR REPLACE FUNCTION auth_tenant() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() ->> 'tenant_id')::uuid;
$$ SECURITY DEFINER;
REVOKE EXECUTE ON FUNCTION auth_tenant() FROM anon, authenticated;

-- Checks a role string in JWT claim 'user_role' (or array)
CREATE OR REPLACE FUNCTION auth_has_role(expected text) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() ->> 'user_role') = expected
     OR (auth.jwt() ->> 'user_role')::text = ANY(STRING_TO_ARRAY(expected, ','));
$$ SECURITY DEFINER;
REVOKE EXECUTE ON FUNCTION auth_has_role(text) FROM anon, authenticated;

-- 3) Audit logging infrastructure --------------------------------------------

-- Audit table to record changes (INSERT/UPDATE/DELETE) for configured tables
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_ts timestamptz NOT NULL DEFAULT now(),
  table_name text NOT NULL,
  operation text NOT NULL, -- INSERT/UPDATE/DELETE
  record jsonb,
  old_record jsonb,
  changed_by uuid, -- auth.uid()
  extra jsonb
);

-- Trigger function to write to audit_logs
CREATE OR REPLACE FUNCTION audit_logs_trigger() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs(table_name, operation, record, changed_by)
    VALUES (TG_TABLE_NAME, TG_OP, to_jsonb(NEW), auth.uid()::uuid);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs(table_name, operation, record, old_record, changed_by)
    VALUES (TG_TABLE_NAME, TG_OP, to_jsonb(NEW), to_jsonb(OLD), auth.uid()::uuid);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs(table_name, operation, old_record, changed_by)
    VALUES (TG_TABLE_NAME, TG_OP, to_jsonb(OLD), auth.uid()::uuid);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION audit_logs_trigger() FROM anon, authenticated;

-- 4) Timestamp triggers for created_at / updated_at --------------------------

-- Common function to set created_at and updated_at
CREATE OR REPLACE FUNCTION set_timestamp() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_at IS NULL THEN
      NEW.created_at := now();
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

-- 5) Soft-delete helper (optional): provide a function to mark deleted_at ----- 
CREATE OR REPLACE FUNCTION soft_delete(table_name text, id_column text, id_value uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  EXECUTE format('UPDATE %I SET deleted_at = now() WHERE %I = $1', table_name, id_column)
    USING id_value;
END;
$$;
REVOKE EXECUTE ON FUNCTION soft_delete(text, text, uuid) FROM anon, authenticated;

-- 6) Example: secure typical user-owned table template -----------------------
-- Replace "user_documents" with your actual table names as needed.

-- Example table (create if not exists) - you can remove if your table exists
CREATE TABLE IF NOT EXISTS user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NULL,
  title text NOT NULL,
  content text,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz
);

-- Attach timestamp trigger for this table
DROP TRIGGER IF EXISTS user_documents_set_timestamp ON user_documents;
CREATE TRIGGER user_documents_set_timestamp
  BEFORE INSERT OR UPDATE ON user_documents
  FOR EACH ROW EXECUTE FUNCTION set_timestamp();

-- Attach audit trigger
DROP TRIGGER IF EXISTS user_documents_audit ON user_documents;
CREATE TRIGGER user_documents_audit
  AFTER INSERT OR UPDATE OR DELETE ON user_documents
  FOR EACH ROW EXECUTE FUNCTION audit_logs_trigger();

-- Enable RLS
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Policies:
-- a) Users can SELECT their own rows (user_id match) and if not deleted
CREATE POLICY user_documents_select_own ON user_documents
  FOR SELECT TO authenticated
  USING (
    (deleted_at IS NULL) AND
    (
      user_id = (SELECT auth.uid())::uuid
      OR tenant_id IS NOT NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- b) Users can INSERT only for themselves (with_check)
CREATE POLICY user_documents_insert_own ON user_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = (SELECT auth.uid())::uuid)
    AND (deleted_at IS NULL)
    -- optionally ensure tenant matches JWT if tenant_id is provided
    AND (
      tenant_id IS NULL OR tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- c) Users can UPDATE their own rows
CREATE POLICY user_documents_update_own ON user_documents
  FOR UPDATE TO authenticated
  USING (
    (deleted_at IS NULL) AND (user_id = (SELECT auth.uid())::uuid)
  )
  WITH CHECK (
    (user_id = (SELECT auth.uid())::uuid)
    AND (deleted_at IS NULL)
  );

-- d) Users can DELETE (soft delete) their own rows: allow delete but recommend updating deleted_at
CREATE POLICY user_documents_delete_own ON user_documents
  FOR DELETE TO authenticated
  USING (
    (user_id = (SELECT auth.uid())::uuid)
  );

-- 7) Tenant-scoped table template -------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz
);

-- Triggers
DROP TRIGGER IF EXISTS customers_set_timestamp ON customers;
CREATE TRIGGER customers_set_timestamp
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_timestamp();

DROP TRIGGER IF EXISTS customers_audit ON customers;
CREATE TRIGGER customers_audit
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_logs_trigger();

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policies:
-- Tenant members (authenticated with matching tenant_id claim) can SELECT
CREATE POLICY customers_select_tenant ON customers
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Tenant members can INSERT only for their tenant
CREATE POLICY customers_insert_tenant ON customers
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND deleted_at IS NULL
  );

-- Tenant members can UPDATE if row belongs to their tenant
CREATE POLICY customers_update_tenant ON customers
  FOR UPDATE TO authenticated
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND deleted_at IS NULL
  )
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND deleted_at IS NULL
  );

-- Admins (JWT user_role = 'admin') can bypass tenant check for SELECT/UPDATE/DELETE
CREATE POLICY customers_admin ON customers
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_role') = 'admin'
  );

-- 8) Role-based access example (sensitive_data) ------------------------------
CREATE TABLE IF NOT EXISTS sensitive_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  data jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

DROP TRIGGER IF EXISTS sensitive_data_set_timestamp ON sensitive_data;
CREATE TRIGGER sensitive_data_set_timestamp
  BEFORE INSERT OR UPDATE ON sensitive_data
  FOR EACH ROW EXECUTE FUNCTION set_timestamp();

DROP TRIGGER IF EXISTS sensitive_data_audit ON sensitive_data;
CREATE TRIGGER sensitive_data_audit
  AFTER INSERT OR UPDATE OR DELETE ON sensitive_data
  FOR EACH ROW EXECUTE FUNCTION audit_logs_trigger();

ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;

-- Only admins and the owner can SELECT
CREATE POLICY sensitive_data_select ON sensitive_data
  FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid())::uuid
    OR (auth.jwt() ->> 'user_role') = 'admin'
  );

-- Only admins and owner can INSERT/UPDATE/DELETE
CREATE POLICY sensitive_data_mod ON sensitive_data
  FOR ALL TO authenticated
  USING (
    owner_id = (SELECT auth.uid())::uuid
    OR (auth.jwt() ->> 'user_role') = 'admin'
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid())::uuid
    OR (auth.jwt() ->> 'user_role') = 'admin'
  );

-- 9) Indexes recommended for policy columns ---------------------------------
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents (user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_tenant_id ON user_documents (tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_owner_id ON sensitive_data (owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name_ts ON audit_logs (table_name, event_ts DESC);

-- 10) Supabase Storage protection example -----------------------------------
-- Secure storage.objects for per-user folders (adjust bucket_id as needed)
-- NOTE: The `storage.foldername(name)` helper exists in Supabase storage extension context.
-- The following is illustrative; check your storage implementation and replace foldername() usage as needed.

ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to INSERT into a 'user-uploads' bucket only in their folder
CREATE POLICY storage_objects_insert_user_uploads ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-uploads' AND (split_part(name, '/', 1)) = (SELECT auth.uid())::text
  );

CREATE POLICY storage_objects_select_user_uploads ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'user-uploads' AND (split_part(name, '/', 1)) = (SELECT auth.uid())::text
  );

-- 11) Realtime messages (realtime.messages) policy templates ----------------
-- Allow users to receive messages for rooms they are members of
-- Assumes a room_members table with (room_id uuid, user_id uuid)
CREATE TABLE IF NOT EXISTS room_members (
  room_id uuid,
  user_id uuid,
  PRIMARY KEY (room_id, user_id)
);

-- Policy on realtime.messages (example; adjust based on actual realtime schema)
-- Note: If realtime.messages doesn't exist in your DB schema as a user table, skip this.
-- The following is illustrative and may require adjustments in your environment.

-- 12) Misc safety: prevent anonymous from inserting into critical tables -----
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- 13) Grant privileges for authenticated role to use common operations ------
GRANT SELECT, INSERT, UPDATE, DELETE ON user_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sensitive_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_logs TO authenticated;

-- 14) Notes and cautions -----------------------------------------------------
-- - This migration is a template; adapt table names, column names, and policy expressions to match your real schema.
-- - Test policies using multiple users (with different JWT claims) before enabling in production.
-- - If you have columns with different names for user id or tenant id, replace occurrences accordingly.
-- - Consider revoking EXECUTE on SECURITY DEFINER functions from public/anon roles (done above for helper functions).
-- - For heavy tables, create indexes on columns referenced in policies (e.g., tenant_id, user_id).
-- - If you don't use soft deletes, remove deleted_at checks and policies that reference deleted_at.