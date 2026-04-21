import { startServer } from "@paperclipai/server";
import { initDb, runMigrations } from "./db/client.js";
import { createApp } from "./server.js";

async function main() {
  const paperclip = await startServer();
  console.log(`[linus] Paperclip running at ${paperclip.apiUrl}`);

  await runMigrations(paperclip.databaseUrl);
  initDb(paperclip.databaseUrl);

  const app = createApp(paperclip.apiUrl);
  const port = Number(process.env.PORT ?? 4000);
  app.listen(port, () => {
    console.log(`[linus] SaaS gateway running at http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
