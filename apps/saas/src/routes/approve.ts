import { Router } from "express";
import { SignJWT, jwtVerify } from "jose";
import { db } from "../db/client.js";
import { linusTenants, linusEmailLog } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { injectCompany } from "../middleware/inject-company.js";
import { requireActiveSub } from "../middleware/require-active-sub.js";

const secret = () => new TextEncoder().encode(process.env.APPROVAL_LINK_SECRET ?? "dev-secret");

export async function createApprovalToken(tenantId: string, emailLogId: string) {
  return new SignJWT({ tenantId, emailLogId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(await secret());
}

export function approveRouter(paperclipApiUrl: string) {
  const router = Router();

  router.post("/:emailLogId", injectCompany, requireActiveSub, async (req, res) => {
    const { emailLogId } = req.params;
    const { action } = req.body as { action: "approve" | "reject" };
    await processApproval(req.tenant!.id, emailLogId, action, paperclipApiUrl);
    res.json({ ok: true });
  });

  router.post("/magic/:token", async (req, res) => {
    try {
      const { payload } = await jwtVerify(req.params.token, await secret());
      const { tenantId, emailLogId } = payload as { tenantId: string; emailLogId: string };
      const { action } = req.body as { action: "approve" | "reject" };
      await processApproval(tenantId, emailLogId, action, paperclipApiUrl);
      res.json({ ok: true });
    } catch {
      res.status(401).json({ error: "Invalid or expired approval link" });
    }
  });

  router.get("/magic/:token", async (req, res) => {
    try {
      const { payload } = await jwtVerify(req.params.token, await secret());
      const { tenantId, emailLogId } = payload as { tenantId: string; emailLogId: string };
      const [email] = await db()
        .select()
        .from(linusEmailLog)
        .where(and(eq(linusEmailLog.id, emailLogId), eq(linusEmailLog.tenantId, tenantId)))
        .limit(1);
      res.json(email ?? null);
    } catch {
      res.status(401).json({ error: "Invalid or expired link" });
    }
  });

  return router;
}

async function processApproval(
  tenantId: string,
  emailLogId: string,
  action: "approve" | "reject",
  paperclipApiUrl: string
) {
  const [email] = await db()
    .select()
    .from(linusEmailLog)
    .where(and(eq(linusEmailLog.id, emailLogId), eq(linusEmailLog.tenantId, tenantId)))
    .limit(1);
  if (!email) throw new Error("Email not found");

  if (action === "approve") {
    await db()
      .update(linusEmailLog)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(linusEmailLog.id, emailLogId));
  } else {
    await db()
      .update(linusEmailLog)
      .set({ status: "rejected" })
      .where(eq(linusEmailLog.id, emailLogId));
  }

  if (email.paperclipIssueId) {
    const [tenant] = await db()
      .select()
      .from(linusTenants)
      .where(eq(linusTenants.id, tenantId))
      .limit(1);

    if (tenant) {
      await fetch(`${paperclipApiUrl}/api/issues/${email.paperclipIssueId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PAPERCLIP_BOARD_API_KEY ?? ""}`,
        },
        body: JSON.stringify({ status: action === "approve" ? "done" : "cancelled" }),
      });
    }
  }

  if (action === "approve") {
    const [tenant] = await db()
      .select()
      .from(linusTenants)
      .where(eq(linusTenants.id, tenantId))
      .limit(1);
    if (tenant && tenant.freeEmailCredits > 0) {
      await db()
        .update(linusTenants)
        .set({ freeEmailCredits: tenant.freeEmailCredits - 1, updatedAt: new Date() })
        .where(eq(linusTenants.id, tenantId));
    }
  }
}
