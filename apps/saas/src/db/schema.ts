import { pgTable, uuid, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const linusTenants = pgTable("linus_tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  paperclipCompanyId: uuid("paperclip_company_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubId: text("stripe_sub_id"),
  subStatus: text("sub_status").notNull().default("free"),
  plan: text("plan").notNull().default("starter"),
  lockedPriceId: text("locked_price_id"),
  foundingCustomer: boolean("founding_customer").notNull().default(false),
  freeEmailCredits: integer("free_email_credits").notNull().default(50),
  referralCode: text("referral_code").notNull(),
  reservationsAddon: boolean("reservations_addon").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const linusOnboardingState = pgTable("linus_onboarding_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  step: text("step").notNull().default("business_info"),
  businessName: text("business_name"),
  businessType: text("business_type"),
  timezone: text("timezone").notNull().default("UTC"),
  gmailConnected: boolean("gmail_connected").notNull().default(false),
  voiceDescription: text("voice_description"),
  testEmailSentAt: timestamp("test_email_sent_at"),
  completedAt: timestamp("completed_at"),
});

export const linusEmailLog = pgTable("linus_email_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  gmailThreadId: text("gmail_thread_id").notNull(),
  receivedAt: timestamp("received_at").notNull(),
  fromAddress: text("from_address").notNull(),
  subject: text("subject"),
  status: text("status").notNull().default("draft"),
  draftBody: text("draft_body"),
  sentAt: timestamp("sent_at"),
  paperclipIssueId: uuid("paperclip_issue_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const linusReferrals = pgTable("linus_referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerTenantId: uuid("referrer_tenant_id").notNull(),
  referredTenantId: uuid("referred_tenant_id").notNull(),
  creditedAt: timestamp("credited_at").notNull().defaultNow(),
});
