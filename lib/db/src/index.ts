import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import pg from "pg";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL must be set.");
}

const isSupabase = connectionString.includes("supabase.");

let _db: ReturnType<typeof drizzlePostgres<typeof schema>> | ReturnType<typeof drizzlePg<typeof schema>>;

if (isSupabase) {
  // Supabase pgbouncer transaction pooler requires prepared statements disabled.
  const sql = postgres(connectionString, {
    prepare: false,
    ssl: "require",
    max: 10,
  });
  _db = drizzlePostgres(sql, { schema });
} else {
  const { Pool } = pg;
  const pool = new Pool({ connectionString });
  _db = drizzlePg(pool, { schema });
}

export const db = _db as ReturnType<typeof drizzlePg<typeof schema>>;

export * from "./schema";
