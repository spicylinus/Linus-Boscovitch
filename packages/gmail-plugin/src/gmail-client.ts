import { google } from "googleapis";

export function createGmailClient(clientId: string, clientSecret: string, refreshToken: string) {
  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth });
}

export async function fetchNewMessages(
  gmail: ReturnType<typeof google.gmail>,
  lastHistoryId: string | null
): Promise<{ threadId: string; messageId: string; from: string; subject: string; body: string; historyId: string }[]> {
  if (lastHistoryId) {
    const historyRes = await gmail.users.history.list({
      userId: "me",
      startHistoryId: lastHistoryId,
      historyTypes: ["messageAdded"],
      labelId: "INBOX",
    });

    const messages = historyRes.data.history?.flatMap((h) => h.messagesAdded ?? []) ?? [];
    const newHistoryId = historyRes.data.historyId ?? lastHistoryId;
    const results = await Promise.all(messages.map((m) => fetchMessage(gmail, m.message!.id!, m.message!.threadId!, newHistoryId)));
    return results.filter(Boolean) as Awaited<ReturnType<typeof fetchMessage>>[];
  }

  const listRes = await gmail.users.messages.list({ userId: "me", labelIds: ["INBOX"], maxResults: 10 });
  const historyId = listRes.data.messages?.[0] ? await getHistoryId(gmail, listRes.data.messages[0].id!) : "1";
  return [];
}

async function getHistoryId(gmail: ReturnType<typeof google.gmail>, messageId: string): Promise<string> {
  const msg = await gmail.users.messages.get({ userId: "me", id: messageId, format: "minimal" });
  return msg.data.historyId ?? "1";
}

async function fetchMessage(
  gmail: ReturnType<typeof google.gmail>,
  messageId: string,
  threadId: string,
  historyId: string
) {
  const msg = await gmail.users.messages.get({ userId: "me", id: messageId, format: "full" });
  const headers = msg.data.payload?.headers ?? [];
  const from = headers.find((h) => h.name === "From")?.value ?? "";
  const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
  const body = extractBody(msg.data.payload);
  if (!from || from.includes("noreply") || from.includes("no-reply")) return null;
  return { threadId, messageId, from, subject, body, historyId };
}

function extractBody(payload: any): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf8");
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const result = extractBody(part);
      if (result) return result;
    }
  }
  return "";
}

export async function sendReply(
  gmail: ReturnType<typeof google.gmail>,
  threadId: string,
  to: string,
  subject: string,
  body: string
) {
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: ${subject.startsWith("Re:") ? subject : `Re: ${subject}`}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
  ).toString("base64url");

  await gmail.users.messages.send({ userId: "me", requestBody: { raw, threadId } });
}
