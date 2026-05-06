import { definePlugin } from "@paperclipai/plugin-sdk";
import type { PluginContext } from "@paperclipai/plugin-sdk";
import { pollInbox } from "./jobs/poll-inbox.js";
import { runSendDigest } from "./jobs/send-digest.js";

// Captured in setup(), used by onWebhook() which doesn't receive ctx directly
let _ctx: PluginContext | null = null;

export default definePlugin({
  async setup(ctx) {
    _ctx = ctx;

    ctx.jobs.register("poll-inbox", async ({ companyId }) => {
      await pollInbox(ctx, companyId);
    });

    ctx.jobs.register("send-digest", async ({ companyId }) => {
      await runSendDigest(ctx, companyId);
    });

    ctx.tools.register("send_email", async ({ companyId, params }) => {
      const { createGmailClient, sendReply } = await import("./gmail-client.js");
      const clientId = await ctx.secrets.resolve({ ref: "gmail-client-id", companyId });
      const clientSecret = await ctx.secrets.resolve({ ref: "gmail-client-secret", companyId });
      const refreshToken = await ctx.secrets.resolve({ ref: "gmail-refresh-token", companyId });
      const gmail = createGmailClient(clientId!, clientSecret!, refreshToken!);
      await sendReply(gmail, params.threadId, params.to, params.subject, params.body);
      await ctx.activity.log({ companyId, verb: "sent_reply", subject: `Reply to ${params.to}` });
      return { ok: true };
    });
  },

  async onWebhook({ endpointKey, parsedBody }) {
    if (endpointKey !== "gmail-push" || !_ctx) return;

    // Google Pub/Sub push sends: { subscription: "...linus-gmail-<companyId>", message: {...} }
    const subscription = (parsedBody as Record<string, unknown>)?.subscription as string ?? "";
    const match = subscription.match(/linus-gmail-([a-f0-9-]+)$/);

    if (match?.[1]) {
      await pollInbox(_ctx, match[1]);
    } else {
      // Fallback: poll all companies (e.g. during dev with a shared subscription)
      const companies = await _ctx.companies.list();
      for (const company of companies) {
        await pollInbox(_ctx, company.id);
      }
    }
  },

  async onHealth() {
    return { status: "ok" };
  },
});
