import type { PluginContext } from "@paperclipai/plugin-sdk";
import { Resend } from "resend";

export async function sendDailyDigest(
  ctx: PluginContext,
  companyId: string,
  ownerEmail: string,
  baseUrl: string
) {
  const resendApiKey = await ctx.secrets.resolve({ ref: "resend-api-key", companyId });
  const resend = new Resend(resendApiKey);

  const activity = await ctx.activity.list({ companyId, limit: 50 });
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const recent = activity.filter((a) => new Date(a.createdAt) >= yesterday);

  const sent = recent.filter((a) => a.verb === "sent_reply").length;
  const escalated = recent.filter((a) => a.verb === "escalated").length;
  const pending = recent.filter((a) => a.verb === "draft_created").length;

  const businessName = (await ctx.state.get({ scopeKind: "company", companyId, stateKey: "business-name" })) ?? "Your Business";

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #1a1a1a;">📬 Daily Inbox Digest — ${businessName}</h2>
  <p style="color: #555;">Here's what Linus handled in the last 24 hours:</p>
  <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
    <tr><td style="padding:8px 0; border-bottom:1px solid #eee;">✅ Replies sent</td><td style="text-align:right; font-weight:bold;">${sent}</td></tr>
    <tr><td style="padding:8px 0; border-bottom:1px solid #eee;">⚠️ Escalated to you</td><td style="text-align:right; font-weight:bold;">${escalated}</td></tr>
    <tr><td style="padding:8px 0;">📝 Awaiting your approval</td><td style="text-align:right; font-weight:bold;">${pending}</td></tr>
  </table>
  ${pending > 0 ? `<a href="${baseUrl}/dashboard" style="display:inline-block; background:#2563eb; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; margin-top:8px;">Review Pending Emails →</a>` : ""}
  <p style="color:#999; font-size:12px; margin-top:32px;">Linus · AI Inbox Manager · <a href="${baseUrl}/dashboard/settings">Manage settings</a></p>
</body>
</html>`;

  await resend.emails.send({
    from: "Linus <digest@linus.app>",
    to: ownerEmail,
    subject: `Inbox digest: ${sent} sent, ${pending} pending — ${new Date().toLocaleDateString()}`,
    html,
  });
}
