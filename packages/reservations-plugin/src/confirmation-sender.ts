import { Resend } from "resend";

export async function sendConfirmation(
  resendApiKey: string,
  opts: { businessName: string; customerEmail: string; customerName: string; date: string; time: string }
) {
  const resend = new Resend(resendApiKey);
  await resend.emails.send({
    from: "Reservations <reservations@linus.app>",
    to: opts.customerEmail,
    subject: `Your reservation at ${opts.businessName} is confirmed`,
    html: `<p>Hi ${opts.customerName},</p>
<p>Your reservation at <strong>${opts.businessName}</strong> is confirmed for <strong>${opts.date} at ${opts.time}</strong>.</p>
<p>We look forward to seeing you!</p>
<p>— The ${opts.businessName} Team</p>`,
  });
}

export async function sendReminder(
  resendApiKey: string,
  opts: { businessName: string; customerEmail: string; customerName: string; date: string; time: string; hoursUntil: number }
) {
  const resend = new Resend(resendApiKey);
  const timing = opts.hoursUntil === 24 ? "tomorrow" : "in about 1 hour";
  await resend.emails.send({
    from: "Reservations <reservations@linus.app>",
    to: opts.customerEmail,
    subject: `Reminder: your reservation at ${opts.businessName} is ${timing}`,
    html: `<p>Hi ${opts.customerName},</p>
<p>Just a reminder that your reservation at <strong>${opts.businessName}</strong> is coming up ${timing} — <strong>${opts.date} at ${opts.time}</strong>.</p>
<p>See you soon!</p>
<p>— The ${opts.businessName} Team</p>`,
  });
}
