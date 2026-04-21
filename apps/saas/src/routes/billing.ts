import { Router } from "express";
import { createCheckoutSession, createPortalSession, handleWebhook, addReservationsAddon } from "../billing/stripe.js";
import { injectCompany } from "../middleware/inject-company.js";
import { requireActiveSub } from "../middleware/require-active-sub.js";

export function billingRouter() {
  const router = Router();

  router.post("/checkout", injectCompany, async (req, res) => {
    const { billingPeriod } = req.body as { billingPeriod?: "monthly" | "annual" };
    const session = await createCheckoutSession(req.tenant!.id, billingPeriod);
    res.json({ url: session.url });
  });

  router.post("/portal", injectCompany, requireActiveSub, async (req, res) => {
    if (!req.tenant!.stripeCustomerId) return res.status(400).json({ error: "No billing account" });
    const session = await createPortalSession(req.tenant!.stripeCustomerId);
    res.json({ url: session.url });
  });

  router.post("/addon/reservations", injectCompany, requireActiveSub, async (req, res) => {
    await addReservationsAddon(req.tenant!.id);
    res.json({ ok: true });
  });

  router.post("/webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    try {
      await handleWebhook(req.body as Buffer, sig);
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: String(err) });
    }
  });

  return router;
}
