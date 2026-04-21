import type { PluginContext } from "@paperclipai/plugin-sdk";
import { sendDailyDigest } from "../digest-builder.js";

export async function runSendDigest(ctx: PluginContext, companyId: string) {
  const ownerEmail = await ctx.state.get({
    scopeKind: "company",
    companyId,
    stateKey: "owner-email",
  });
  if (!ownerEmail) return;

  await sendDailyDigest(ctx, companyId, ownerEmail, process.env.APP_URL ?? "http://localhost:4000");
}
