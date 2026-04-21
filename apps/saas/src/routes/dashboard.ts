import { Router } from "express";
import { db } from "../db/client.js";
import { linusEmailLog } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { injectCompany } from "../middleware/inject-company.js";
import { requireActiveSub } from "../middleware/require-active-sub.js";

export function dashboardRouter(paperclipApiUrl: string) {
  const router = Router();

  router.use(injectCompany);

  router.get("/inbox", async (req, res) => {
    const emails = await db()
      .select()
      .from(linusEmailLog)
      .where(eq(linusEmailLog.tenantId, req.tenant!.id))
      .orderBy(desc(linusEmailLog.receivedAt))
      .limit(50);
    res.json(emails);
  });

  router.get("/pending-approvals", async (req, res) => {
    const emails = await db()
      .select()
      .from(linusEmailLog)
      .where(eq(linusEmailLog.tenantId, req.tenant!.id))
      .orderBy(desc(linusEmailLog.receivedAt));
    res.json(emails.filter((e) => e.status === "pending_approval" || e.status === "draft"));
  });

  router.get("/activity", async (req, res) => {
    const apiKey = process.env.PAPERCLIP_BOARD_API_KEY ?? "";
    const companyId = req.tenant!.paperclipCompanyId;
    const upstream = await fetch(
      `${paperclipApiUrl}/api/companies/${companyId}/activity?limit=20`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const data = await upstream.json();
    res.json(data);
  });

  router.get("/stats", async (req, res) => {
    const all = await db()
      .select()
      .from(linusEmailLog)
      .where(eq(linusEmailLog.tenantId, req.tenant!.id));

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekly = all.filter((e) => e.receivedAt >= weekAgo);

    res.json({
      total: all.length,
      sent: all.filter((e) => e.status === "sent").length,
      pending: all.filter((e) => e.status === "pending_approval" || e.status === "draft").length,
      escalated: all.filter((e) => e.status === "escalated").length,
      weeklyHandled: weekly.filter((e) => e.status === "sent").length,
      freeCreditsRemaining: req.tenant!.freeEmailCredits,
    });
  });

  return router;
}
