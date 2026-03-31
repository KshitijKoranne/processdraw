import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Wipe demo data every day at midnight UTC
crons.daily(
  "wipe demo data",
  { hourUTC: 0, minuteUTC: 0 },
  internal.demoData.wipeDemoData
);

export default crons;
