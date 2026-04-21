import type { PluginContext } from "@paperclipai/plugin-sdk";
import { createGmailClient, fetchNewMessages, sendReply } from "../gmail-client.js";
import { draftReply } from "../draft-engine.js";
import { createEscalationIssue } from "../approval-gate.js";

export async function pollInbox(ctx: PluginContext, companyId: string) {
  const clientId = await ctx.secrets.resolve({ ref: "gmail-client-id", companyId });
  const clientSecret = await ctx.secrets.resolve({ ref: "gmail-client-secret", companyId });
  const refreshToken = await ctx.secrets.resolve({ ref: "gmail-refresh-token", companyId });

  if (!clientId || !clientSecret || !refreshToken) {
    ctx.logger.warn({ companyId }, "Gmail credentials not configured");
    return;
  }

  const gmail = createGmailClient(clientId, clientSecret, refreshToken);

  const lastHistoryId = await ctx.state.get({
    scopeKind: "company",
    companyId,
    stateKey: "last-history-id",
  });

  const messages = await fetchNewMessages(gmail, lastHistoryId ?? null);
  if (!messages.length) return;

  const companies = await ctx.companies.list();
  const company = companies.find((c) => c.id === companyId);
  const agents = await ctx.agents.list({ companyId });
  const receptionist = agents.find((a) => a.key === "receptionist");
  const inboxManager = agents.find((a) => a.key === "inbox_manager");

  if (!receptionist) {
    ctx.logger.error({ companyId }, "Receptionist agent not found");
    return;
  }

  for (const msg of messages) {
    const result = await draftReply(ctx, companyId, receptionist.id, {
      from: msg.from,
      subject: msg.subject,
      body: msg.body,
    });

    if (result.type === "escalate" && inboxManager) {
      await createEscalationIssue(ctx, companyId, inboxManager.id, {
        from: msg.from,
        subject: msg.subject,
        body: msg.body,
        threadId: msg.threadId,
      }, result.reason);

      await ctx.events.emit("plugin.inbox.email_escalated", {
        companyId,
        threadId: msg.threadId,
        reason: result.reason,
      });
    } else if (result.type === "reservation") {
      await ctx.events.emit("plugin.reservation.detected", {
        companyId,
        threadId: msg.threadId,
        customerEmail: msg.from,
        customerName: result.name,
        date: result.date,
        time: result.time,
        draftBody: result.draftBody,
      });

      await sendReply(gmail, msg.threadId, msg.from, msg.subject, result.draftBody);
    } else if (result.type === "draft") {
      await sendReply(gmail, msg.threadId, msg.from, msg.subject, result.body);
      await ctx.events.emit("plugin.inbox.email_sent", { companyId, threadId: msg.threadId });
    }

    await ctx.state.set({
      scopeKind: "company",
      companyId,
      stateKey: "last-history-id",
      value: msg.historyId,
    });
  }
}
