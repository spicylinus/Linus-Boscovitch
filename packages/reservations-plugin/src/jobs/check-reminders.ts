import type { PluginContext } from "@paperclipai/plugin-sdk";
import { sendReminder } from "../confirmation-sender.js";

type Reservation = {
  id: string;
  customerEmail: string;
  customerName: string;
  datetime: string;
  businessName: string;
  confirmationSentAt?: string;
  reminder24hSentAt?: string;
  reminder1hSentAt?: string;
};

export async function checkReminders(ctx: PluginContext, companyId: string) {
  const raw = await ctx.state.get({ scopeKind: "company", companyId, stateKey: "reservations" });
  if (!raw) return;

  const reservations: Reservation[] = JSON.parse(raw);
  const now = new Date();
  const resendApiKey = await ctx.secrets.resolve({ ref: "resend-api-key", companyId });
  if (!resendApiKey) return;

  let updated = false;

  for (const r of reservations) {
    const dt = new Date(r.datetime);
    const hoursUntil = (dt.getTime() - now.getTime()) / (1000 * 60 * 60);

    const [date, time] = r.datetime.split("T");

    if (hoursUntil <= 25 && hoursUntil > 23 && !r.reminder24hSentAt) {
      await sendReminder(resendApiKey, { ...r, date, time, hoursUntil: 24 });
      r.reminder24hSentAt = now.toISOString();
      updated = true;
    }

    if (hoursUntil <= 1.5 && hoursUntil > 0 && !r.reminder1hSentAt) {
      await sendReminder(resendApiKey, { ...r, date, time, hoursUntil: 1 });
      r.reminder1hSentAt = now.toISOString();
      updated = true;
    }
  }

  if (updated) {
    await ctx.state.set({ scopeKind: "company", companyId, stateKey: "reservations", value: JSON.stringify(reservations) });
  }
}
