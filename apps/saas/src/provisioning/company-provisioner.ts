import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
import { db } from "../db/client.js";
import { linusTenants, linusOnboardingState } from "../db/schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(__dirname, "../../../../packages/linus-template/company.json");

let paperclipApiUrl = "";

export function setPaperclipApiUrl(url: string) {
  paperclipApiUrl = url;
}

export async function provisionCompany(opts: {
  userId: string;
  businessName?: string;
  businessType?: string;
}) {
  const apiKey = process.env.PAPERCLIP_BOARD_API_KEY ?? "";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };

  const companyRes = await fetch(`${paperclipApiUrl}/api/companies`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: opts.businessName ?? "My Business" }),
  });
  if (!companyRes.ok) throw new Error(`Failed to create Paperclip company: ${companyRes.status}`);
  const { id: paperclipCompanyId } = (await companyRes.json()) as { id: string };

  const template = JSON.parse(readFileSync(TEMPLATE_PATH, "utf8"));
  await fetch(`${paperclipApiUrl}/api/companies/${paperclipCompanyId}/portability/import`, {
    method: "POST",
    headers,
    body: JSON.stringify({ bundle: template, collisionStrategy: "skip" }),
  });

  const isFoundingCustomer =
    process.env.FOUNDING_PERIOD_END_DATE
      ? new Date() < new Date(process.env.FOUNDING_PERIOD_END_DATE)
      : true;

  const referralCode = nanoid(8);

  const [tenant] = await db()
    .insert(linusTenants)
    .values({
      userId: opts.userId,
      paperclipCompanyId,
      foundingCustomer: isFoundingCustomer,
      referralCode,
    })
    .returning();

  await db().insert(linusOnboardingState).values({ tenantId: tenant.id });

  return tenant;
}
