import { drizzle } from "drizzle-orm/node-postgres";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import * as schema from "./schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;

export function initDb(databaseUrl: string) {
  _pool = new pg.Pool({ connectionString: databaseUrl });
  _db = drizzle(_pool, { schema });
  return _db;
}

export function db() {
  if (!_db) throw new Error("DB not initialised — call initDb() first");
  return _db;
}

export async function runMigrations(databaseUrl: string) {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const sql = readFileSync(join(__dirname, "migrations/001_initial.sql"), "utf8");
  await pool.query(sql);
  await pool.end();
}
