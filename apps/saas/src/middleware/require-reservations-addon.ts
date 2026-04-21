import type { Request, Response, NextFunction } from "express";

export function requireReservationsAddon(req: Request, res: Response, next: NextFunction) {
  if (!req.tenant?.reservationsAddon) {
    return res.status(402).json({ error: "Reservations add-on required", upgradeUrl: "/billing/addon/reservations" });
  }
  next();
}
