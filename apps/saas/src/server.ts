import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { billingRouter } from "./routes/billing.js";
import { onboardRouter } from "./routes/onboard.js";
import { gmailCallbackRouter } from "./routes/gmail-callback.js";
import { approveRouter } from "./routes/approve.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { referralRouter } from "./routes/referral.js";

export function createApp(paperclipApiUrl: string) {
  const app = express();

  app.use("/auth/gmail/callback", gmailCallbackRouter(paperclipApiUrl));

  app.use("/billing/webhook", express.raw({ type: "application/json" }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.all("/auth/*", (req, res) => toNodeHandler(auth())(req, res));

  app.use("/billing", billingRouter());
  app.use("/onboard", onboardRouter(paperclipApiUrl));
  app.use("/approve", approveRouter(paperclipApiUrl));
  app.use("/dashboard", dashboardRouter(paperclipApiUrl));
  app.use("/referral", referralRouter());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  return app;
}
