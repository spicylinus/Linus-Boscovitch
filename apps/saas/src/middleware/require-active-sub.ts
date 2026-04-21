import type { Request, Response, NextFunction } from "express";

export function requireActiveSub(req: Request, res: Response, next: NextFunction) {
  const tenant = req.tenant;
  if (!tenant) return res.status(401).json({ error: "Unauthorized" });

  const hasFreeCredits = tenant.freeEmailCredits > 0;
  const hasActiveSub = tenant.subStatus === "active" || tenant.subStatus === "trialing";

  if (!hasFreeCredits && !hasActiveSub) {
    return res.status(402).json({ error: "Subscription required", upgradeUrl: "/billing/checkout" });
  }

  next();
}
