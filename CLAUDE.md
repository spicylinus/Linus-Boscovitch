# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

This project uses [Paperclip AI](https://paperclip.ing/) — an open-source Node.js server and React UI for orchestrating teams of AI agents.

## Commands

```bash
# Start the Paperclip server
npx paperclipai

# Install dependencies
npm install
```

## Stack

- **Runtime:** Node.js
- **Package manager:** npm
- **Core dependency:** `paperclipai` — bundles `@paperclipai/server` (Express/Node backend) and `@paperclipai/db` (Drizzle ORM)

## Security

- Dependencies are **pinned to exact versions** (`save-exact=true` in `.npmrc`); always use exact versions when adding packages.
- `.env` and credential files are gitignored — use `.env.example` for documenting required variables.
- `npm audit --audit-level=high` runs on every push/PR via `.github/workflows/security.yml`.
- Dependabot is configured (`.github/dependabot.yml`) for weekly npm dependency updates.

## Known Issues

`npm audit` reports 4 high-severity vulnerabilities in `drizzle-orm` (SQL injection via improperly escaped identifiers, [GHSA-gpj5-g38j-94v9](https://github.com/advisories/GHSA-gpj5-g38j-94v9)) inside `paperclipai`'s transitive dependencies. No upstream fix is available — do not attempt `npm audit fix` as it cannot resolve them.
