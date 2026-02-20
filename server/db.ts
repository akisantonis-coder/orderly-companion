import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

console.log("[DB] Checking DATABASE_URL...");
if (!process.env.DATABASE_URL) {
  console.error("[DB] ERROR: DATABASE_URL is not set!");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}
console.log("[DB] DATABASE_URL is set (length:", process.env.DATABASE_URL.length, "chars)");

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Test connection on startup
pool.on('connect', () => {
  console.log("[DB] Database connection established");
});

pool.on('error', (err) => {
  console.error("[DB] Database connection error:", err);
});
