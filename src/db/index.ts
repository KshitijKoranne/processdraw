import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzleNeon<typeof schema>>;

let _db: Db | null = null;

// Lazy init so importing route modules at build time (when DATABASE_URL may
// be absent) doesn't throw; the connection is only created on first use.
// Set DB_DRIVER=pg to use a plain TCP Postgres (local development/testing);
// the default is Neon's serverless HTTP driver.
export function getDb(): Db {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    if (process.env.DB_DRIVER === "pg") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { drizzle: drizzlePg } = require("drizzle-orm/node-postgres");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pool } = require("pg");
      _db = drizzlePg(new Pool({ connectionString: url }), { schema }) as unknown as Db;
    } else {
      _db = drizzleNeon(neon(url), { schema });
    }
  }
  return _db;
}

export { schema };
