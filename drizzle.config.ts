import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// drizzle-kit doesn't read .env.local by itself; use Next's loader.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
