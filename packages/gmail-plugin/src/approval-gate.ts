import type { PluginContext } from "@paperclipai/plugin-sdk";

export async function createEscalationIssue(
  ctx: PluginContext,
  companyId: string,
  inboxManagerAgentId: string,
  email: { from: string; subject: string; body: string; threadId: string },
  reason: string
): Promise<string> {
  const issue = await ctx.issues.create({
    companyId,
    title: `Escalated email: ${email.subject}`,
    description: `**From:** ${email.from}\n**Reason for escalation:** ${reason}\n\n**Original email:**\n${email.body}`,
    assigneeAgentId: inboxManagerAgentId,
    priority: "urgent",
    metadata: { gmailThreadId: email.threadId },
  });

  await ctx.activity.log({
    companyId,
    verb: "escalated",
    subject: `Email from ${email.from}`,
    detail: reason,
  });

  return issue.id;
}
