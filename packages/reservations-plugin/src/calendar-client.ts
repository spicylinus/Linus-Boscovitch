import { google } from "googleapis";

export function createCalendarClient(clientId: string, clientSecret: string, refreshToken: string) {
  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: "v3", auth });
}

export async function createCalendarEvent(
  calendar: ReturnType<typeof google.calendar>,
  opts: { customerName: string; customerEmail: string; date: string; time: string; businessName: string }
) {
  const startStr = `${opts.date}T${opts.time.includes(":") ? opts.time : opts.time + ":00"}:00`;
  const start = new Date(startStr);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `Reservation: ${opts.customerName}`,
      description: `Customer: ${opts.customerName}\nEmail: ${opts.customerEmail}`,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: [{ email: opts.customerEmail }],
    },
  });

  return event.data.id!;
}
