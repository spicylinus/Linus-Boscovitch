import type { PluginContext } from "@paperclipai/plugin-sdk";

export type DraftResult =
  | { type: "draft"; body: string }
  | { type: "escalate"; reason: string }
  | { type: "reservation"; name: string; date: string; time: string; draftBody: string };

export async function draftReply(
  ctx: PluginContext,
  companyId: string,
  receptionistAgentId: string,
  email: { from: string; subject: string; body: string }
): Promise<DraftResult> {
  const voiceDescription = await ctx.state.get({
    scopeKind: "company",
    companyId,
    stateKey: "business-voice-description",
  });

  const businessName = await ctx.state.get({
    scopeKind: "company",
    companyId,
    stateKey: "business-name",
  });

  const prompt = `A customer emailed:
From: ${email.from}
Subject: ${email.subject}
Body:
${email.body}

Business voice notes: ${voiceDescription ?? "Be friendly and professional."}

Please draft a reply for ${businessName ?? "this business"}.`;

  const session = await ctx.agents.sessions.create({ agentId: receptionistAgentId, companyId });
  const response = await ctx.agents.sessions.sendMessage({ sessionId: session.id, message: prompt });
  await ctx.agents.sessions.close({ sessionId: session.id });

  const text = response.content ?? "";

  const reservationMatch = text.match(/RESERVATION:\s*name=([^,\n]+)[,\s]+date=([^,\n]+)[,\s]+time=([^\n]+)/i);
  if (reservationMatch) {
    const draftMatch = text.match(/DRAFT:\s*([\s\S]+)/i);
    return {
      type: "reservation",
      name: reservationMatch[1].trim(),
      date: reservationMatch[2].trim(),
      time: reservationMatch[3].trim(),
      draftBody: draftMatch?.[1]?.trim() ?? "",
    };
  }

  const escalateMatch = text.match(/ESCALATE:\s*([\s\S]+)/i);
  if (escalateMatch) return { type: "escalate", reason: escalateMatch[1].trim() };

  const draftMatch = text.match(/DRAFT:\s*([\s\S]+)/i);
  if (draftMatch) return { type: "draft", body: draftMatch[1].trim() };

  return { type: "draft", body: text.trim() };
}
