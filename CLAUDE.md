# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Linus** — AI Customer Inbox Manager for small businesses ($7.99/month SaaS) built on [Paperclip AI](https://paperclip.ing/). Linus gives each customer a 24/7 AI receptionist that reads their Gmail inbox, drafts replies in their business voice, escalates urgent emails, and sends daily digests.

## Commands

```bash
# Start Paperclip (:3100) + SaaS gateway (:4000) together
npm run dev

# Frontend dev server (:5173, proxies API calls to :4000)
cd apps/web && npm run dev

# Build Gmail plugin
npm run build:plugin:gmail

# Build reservations plugin
npm run build:plugin:reservations

# Install all workspace dependencies
npm install
```

## Stack

| Layer | Tech |
|---|---|
| Agent orchestration | `paperclipai` (Paperclip AI — Express + embedded Postgres + plugin runtime) |
| SaaS gateway | Express 5 (`apps/saas/`) on port 4000 |
| Auth | `better-auth` 1.4 — reuses Paperclip's `user`/`session` Postgres tables |
| Database | Paperclip's embedded Postgres; SaaS tables use `linus_` prefix (Drizzle ORM 0.45) |
| Billing | Stripe — monthly $7.99, annual $79.90, reservations add-on $1.99 |
| Email | Resend (transactional + digests) |
| Gmail | `googleapis` — OAuth2 refresh token stored as Paperclip company secret |
| Frontend | React 19 + Vite 6 + Tailwind CSS 4 (`apps/web/`) |
| Plugins | `@paperclipai/plugin-sdk` — Gmail connector, reservations |

## Architecture

```
User browser (:5173 dev)
  → apps/web  (React + Vite SPA)
  → apps/saas (Express :4000 — SaaS gateway)
      → better-auth  (auth.ts)
      → Stripe webhooks  (billing/stripe.ts)
      → Paperclip REST API (:3100)
          → gmail-plugin worker (child process)
                → Gmail API
                → Claude (Receptionist agent session)
                → Resend (digests)
          → reservations-plugin worker (child process)
                → Google Calendar API
                → Resend (confirmations + reminders)
```

**Key design decisions:**
- Each paying customer = one Paperclip `company`. Multi-tenancy is free.
- Paperclip's embedded Postgres is the one database. SaaS tables use `linus_` prefix.
- Gmail connector and reservations are Paperclip plugins (isolated child processes, JSON-RPC over stdio).
- Approval flow reuses Paperclip's native `issues` + `approvals` tables for audit trail.
- The `linus-template/company.json` portability bundle is imported for every new customer at signup, stamping in Receptionist + Inbox Manager agents with a $3/month budget cap.

## Repo Structure

```
apps/
  saas/src/
    index.ts              — boot: startServer() then Express :4000
    server.ts             — Express app factory
    auth.ts               — better-auth config (onUserCreated → provision)
    billing/stripe.ts     — checkout, portal, webhook, add-on
    provisioning/company-provisioner.ts  — creates Paperclip company + imports template
    db/schema.ts          — linus_tenants, linus_onboarding_state, linus_email_log, linus_referrals
    db/client.ts          — initDb(), db(), runMigrations()
    routes/               — billing, onboard, approve, dashboard, referral, gmail-callback
    middleware/           — inject-company, require-active-sub, require-reservations-addon
  web/src/pages/
    Onboard.tsx           — 4-step wizard (business info → Gmail → voice → test)
    Dashboard.tsx         — inbox stream, approval queue, weekly stats
    Approve.tsx           — magic-link token approval screen (no login required)
packages/
  linus-template/company.json   — Paperclip portability bundle per customer
  gmail-plugin/src/
    worker.ts             — definePlugin() entrypoint
    gmail-client.ts       — OAuth2, fetchNewMessages, sendReply
    draft-engine.ts       — creates Claude agent session, parses DRAFT/ESCALATE/RESERVATION
    approval-gate.ts      — ctx.issues.create() for escalations
    digest-builder.ts     — Resend daily digest with approval deep-links
    jobs/poll-inbox.ts    — every 15 min: fetch + draft + route emails
    jobs/send-digest.ts   — daily 08:00: send owner digest
  reservations-plugin/src/
    worker.ts             — listens for plugin.reservation.detected event
    calendar-client.ts    — Google Calendar create event
    confirmation-sender.ts — Resend confirmation + reminder emails
    jobs/check-reminders.ts — hourly: send 24h and 1h reminders
```

## Security

- Dependencies are **pinned to exact versions** (`save-exact=true` in `.npmrc`); always use exact versions when adding packages.
- `.env` and credential files are gitignored — use `.env.example` for documenting required variables.
- `npm audit --audit-level=high` runs on every push/PR via `.github/workflows/security.yml`.
- Dependabot is configured (`.github/dependabot.yml`) for weekly npm dependency updates.

## Known Issues

`npm audit` reports 4 high-severity vulnerabilities in `drizzle-orm` (SQL injection via improperly escaped identifiers, [GHSA-gpj5-g38j-94v9](https://github.com/advisories/GHSA-gpj5-g38j-94v9)) inside `paperclipai`'s transitive dependencies. No upstream fix is available — do not attempt `npm audit fix` as it cannot resolve them.

## Pricing Model

| Tier | Price | Who |
|---|---|---|
| Founding (days 0–90) | $7.99/mo | Locked forever — `founding_customer = true` in DB |
| Standard | $9.99/mo | All new signups after `FOUNDING_PERIOD_END_DATE` |
| Annual | $79.90/yr | Available to all, 2 months free vs monthly |
| Reservations add-on | +$1.99/mo | Stripe subscription item on top of any plan |

First 50 emails are free (no credit card). `linus_tenants.free_email_credits` decrements on each sent email. When 0 and no active sub, the approve route returns 402.
