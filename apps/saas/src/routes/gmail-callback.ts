import { Router } from "express";
import { google } from "googleapis";
import { db } from "../db/client.js";
import { linusTenants, linusOnboardingState } from "../db/schema.js";
import { eq } from "drizzle-orm";

export function gmailCallbackRouter(paperclipApiUrl: string) {
  const router = Router();

  router.get("/gmail/callback", async (req, res) => {
    const { code, state: tenantId } = req.query as { code: string; state: string };

    const oauth2 = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    const { tokens } = await oauth2.getToken(code);

    const [tenant] = await db()
      .select()
      .from(linusTenants)
      .where(eq(linusTenants.id, tenantId))
      .limit(1);
    if (!tenant) return res.status(404).send("Tenant not found");

    const apiKey = process.env.PAPERCLIP_BOARD_API_KEY ?? "";
    await fetch(`${paperclipApiUrl}/api/companies/${tenant.paperclipCompanyId}/secrets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        name: "gmail-refresh-token",
        value: tokens.refresh_token,
        provider: "local-encrypted",
      }),
    });

    await db()
      .update(linusOnboardingState)
      .set({ gmailConnected: true, step: "voice_setup" })
      .where(eq(linusOnboardingState.tenantId, tenantId));

    res.redirect("/onboard?step=voice_setup");
  });

  return router;
}
