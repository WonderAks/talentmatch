import { Pool } from "pg";

// One pooled connection per server process. Credentials come from the environment.
const g = globalThis as unknown as { pool?: Pool };

export const pool =
  g.pool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") g.pool = pool;
