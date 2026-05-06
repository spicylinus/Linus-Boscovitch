import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import { db } from "../db/client.js";
import { linusTenants } from "../db/schema.js";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      tenant?: typeof linusTenants.$inferSelect;
    }
  }
}

export async function injectCompany(req: Request, res: Response, next: NextFunction) {
  const session = await auth().api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) return res.status(401).json({ error: "Unauthorized" });

  const [tenant] = await db()
    .select()
    .from(linusTenants)
    .where(eq(linusTenants.userId, session.user.id))
    .limit(1);

  if (!tenant) return res.status(404).json({ error: "Account not found" });

  req.tenant = tenant;
  next();
}
