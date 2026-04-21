import { definePlugin } from "@paperclipai/plugin-sdk";
import { createCalendarClient, createCalendarEvent } from "./calendar-client.js";
import { sendConfirmation } from "./confirmation-sender.js";
import { checkReminders } from "./jobs/check-reminders.js";

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

definePlugin({
  async setup(ctx) {
    ctx.jobs.register("check-reminders", async ({ companyId }) => {
      await checkReminders(ctx, companyId);
    });

    ctx.events.on("plugin.reservation.detected", async (payload) => {
      const { companyId, customerEmail, customerName, date, time, draftBody } = payload as {
        companyId: string;
        customerEmail: string;
        customerName: string;
        date: string;
        time: string;
        draftBody: string;
      };

      const clientId = await ctx.secrets.resolve({ ref: "gmail-client-id", companyId });
      const clientSecret = await ctx.secrets.resolve({ ref: "gmail-client-secret", companyId });
      const refreshToken = await ctx.secrets.resolve({ ref: "gmail-refresh-token", companyId });
      const resendApiKey = await ctx.secrets.resolve({ ref: "resend-api-key", companyId });
      const businessName =
        (await ctx.state.get({ scopeKind: "company", companyId, stateKey: "business-name" })) ?? "Your Business";

      if (!clientId || !clientSecret || !refreshToken || !resendApiKey) return;

      const calendar = createCalendarClient(clientId, clientSecret, refreshToken);
      await createCalendarEvent(calendar, { customerName, customerEmail, date, time, businessName });

      await sendConfirmation(resendApiKey, { businessName, customerEmail, customerName, date, time });

      const raw = await ctx.state.get({ scopeKind: "company", companyId, stateKey: "reservations" });
      const reservations: Reservation[] = raw ? JSON.parse(raw) : [];
      reservations.push({
        id: `${Date.now()}`,
        customerEmail,
        customerName,
        datetime: `${date}T${time}`,
        businessName,
        confirmationSentAt: new Date().toISOString(),
      });
      await ctx.state.set({ scopeKind: "company", companyId, stateKey: "reservations", value: JSON.stringify(reservations) });

      await ctx.activity.log({ companyId, verb: "reservation_created", subject: `Reservation for ${customerName} on ${date}` });
    });
  },

  async onHealth() {
    return { status: "ok" };
  },
});
