// Applies pending SQL migrations from ./drizzle to DATABASE_URL.
// Runs automatically before `npm run dev` and `npm run build` (see package.json),
// so a fresh Neon database is always brought up to date without a manual step.
// Safe to run repeatedly: drizzle tracks applied migrations and skips them.
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[migrate] DATABASE_URL not set — skipping (configure .env.local or your deploy environment).");
    return;
  }

  if (process.env.DB_DRIVER === "pg") {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const pool = new Pool({ connectionString: url });
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
    await pool.end();
  } else {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { migrate } = await import("drizzle-orm/neon-http/migrator");
    await migrate(drizzle(neon(url)), { migrationsFolder: "./drizzle" });
  }

  console.log("[migrate] Database schema is up to date.");
}

main().catch((error) => {
  console.error("[migrate] Migration failed:", error);
  process.exit(1);
});
