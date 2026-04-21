import { definePlugin } from "@paperclipai/plugin-sdk";
import { pollInbox } from "./jobs/poll-inbox.js";
import { runSendDigest } from "./jobs/send-digest.js";

definePlugin({
  async setup(ctx) {
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

  async onWebhook({ endpointKey, companyId, payload }) {
    if (endpointKey === "gmail-push") {
      await pollInbox(this as any, companyId);
    }
  },

  async onHealth() {
    return { status: "ok" };
  },
});
