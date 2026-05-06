import { Router } from "express";
import { google } from "googleapis";
import { db } from "../db/client.js";
import { linusOnboardingState } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { injectCompany } from "../middleware/inject-company.js";

export function onboardRouter(paperclipApiUrl: string) {
  const router = Router();

  router.use(injectCompany);

  router.patch("/business-info", async (req, res) => {
    const { businessName, businessType, timezone } = req.body as {
      businessName: string;
      businessType: string;
      timezone: string;
    };
    await db()
      .update(linusOnboardingState)
      .set({ businessName, businessType, timezone, step: "gmail_connect" })
      .where(eq(linusOnboardingState.tenantId, req.tenant!.id));
    res.json({ ok: true });
  });

  router.post("/voice-setup", async (req, res) => {
    const { voiceDescription } = req.body as { voiceDescription: string };
    await db()
      .update(linusOnboardingState)
      .set({ voiceDescription, step: "test_email" })
      .where(eq(linusOnboardingState.tenantId, req.tenant!.id));
    res.json({ ok: true });
  });

  router.post("/test-email", async (req, res) => {
    await db()
      .update(linusOnboardingState)
      .set({ testEmailSentAt: new Date(), step: "done", completedAt: new Date() })
      .where(eq(linusOnboardingState.tenantId, req.tenant!.id));
    res.json({ ok: true });
  });

  router.get("/status", async (req, res) => {
    const [state] = await db()
      .select()
      .from(linusOnboardingState)
      .where(eq(linusOnboardingState.tenantId, req.tenant!.id))
      .limit(1);
    res.json(state ?? null);
  });

  router.get("/gmail/connect", (req, res) => {
    const oauth2 = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    const url = oauth2.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/gmail.modify"],
      state: req.tenant!.id,
    });
    res.redirect(url);
  });

  return router;
}
