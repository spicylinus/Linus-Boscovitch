import { Router } from "express";
import { db } from "../db/client.js";
import { linusTenants } from "../db/schema.js";
import { eq } from "drizzle-orm";

export function referralRouter() {
  const router = Router();

  router.get("/:code", async (req, res) => {
    const [tenant] = await db()
      .select({ id: linusTenants.id })
      .from(linusTenants)
      .where(eq(linusTenants.referralCode, req.params.code))
      .limit(1);

    if (!tenant) return res.status(404).json({ error: "Invalid referral code" });

    res.cookie("referral_code", req.params.code, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
    res.redirect("/signup");
  });

  return router;
}
