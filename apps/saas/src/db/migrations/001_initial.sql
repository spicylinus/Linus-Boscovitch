CREATE TABLE IF NOT EXISTS linus_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  paperclip_company_id UUID NOT NULL,
  stripe_customer_id TEXT,
  stripe_sub_id TEXT,
  sub_status TEXT NOT NULL DEFAULT 'free',
  plan TEXT NOT NULL DEFAULT 'starter',
  locked_price_id TEXT,
  founding_customer BOOLEAN NOT NULL DEFAULT false,
  free_email_credits INTEGER NOT NULL DEFAULT 50,
  referral_code TEXT NOT NULL,
  reservations_addon BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS linus_onboarding_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES linus_tenants(id) ON DELETE CASCADE,
  step TEXT NOT NULL DEFAULT 'business_info',
  business_name TEXT,
  business_type TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  gmail_connected BOOLEAN NOT NULL DEFAULT false,
  voice_description TEXT,
  test_email_sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS linus_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES linus_tenants(id) ON DELETE CASCADE,
  gmail_thread_id TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  from_address TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  draft_body TEXT,
  sent_at TIMESTAMPTZ,
  paperclip_issue_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS linus_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_tenant_id UUID NOT NULL REFERENCES linus_tenants(id) ON DELETE CASCADE,
  referred_tenant_id UUID NOT NULL REFERENCES linus_tenants(id) ON DELETE CASCADE,
  credited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS linus_tenants_user_id_idx ON linus_tenants(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS linus_tenants_referral_code_idx ON linus_tenants(referral_code);
CREATE INDEX IF NOT EXISTS linus_email_log_tenant_id_idx ON linus_email_log(tenant_id);
CREATE INDEX IF NOT EXISTS linus_email_log_status_idx ON linus_email_log(tenant_id, status);
