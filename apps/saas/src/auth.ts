import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { provisionCompany } from "./provisioning/company-provisioner.js";

let _auth: ReturnType<typeof betterAuth> | null = null;

export function initAuth(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });

  _auth = betterAuth({
    database: { db: pool, type: "pg" },
    secret: process.env.BETTER_AUTH_SECRET ?? "change-me-in-production",
    emailAndPassword: { enabled: true },
    callbacks: {
      async onUserCreated({ user }) {
        const referralCode = (user as { referralCode?: string }).referralCode;
        await provisionCompany({ userId: user.id });
        if (referralCode) {
          await applyReferralCredit(user.id, referralCode);
        }
      },
    },
  });

  return _auth;
}

export function auth() {
  if (!_auth) throw new Error("Auth not initialised");
  return _auth;
}

async function applyReferralCredit(newUserId: string, code: string) {
  const { db: database } = await import("./db/client.js");
  const { linusTenants, linusReferrals } = await import("./db/schema.js");
  const { eq } = await import("drizzle-orm");

  const [referrer] = await database()
    .select()
    .from(linusTenants)
    .where(eq(linusTenants.referralCode, code))
    .limit(1);

  if (!referrer) return;

  const [newTenant] = await database()
    .select()
    .from(linusTenants)
    .where(eq(linusTenants.userId, newUserId))
    .limit(1);

  if (!newTenant) return;

  await database()
    .update(linusTenants)
    .set({ freeEmailCredits: referrer.freeEmailCredits + 50 })
    .where(eq(linusTenants.id, referrer.id));

  await database()
    .update(linusTenants)
    .set({ freeEmailCredits: newTenant.freeEmailCredits + 50 })
    .where(eq(linusTenants.id, newTenant.id));

  await database()
    .insert(linusReferrals)
    .values({ referrerTenantId: referrer.id, referredTenantId: newTenant.id });
}
