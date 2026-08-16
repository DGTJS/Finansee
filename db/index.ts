import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "dotenv";
import { Pool } from "pg";
import * as schema from "./schema";

config({ path: ".env.local" });
config();

const globalForDb = globalThis as unknown as { pool?: Pool };
export const pool = globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL ?? "postgresql://finansee:finansee_local@localhost:5432/finansee" });
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;
export const db = drizzle(pool, { schema });
