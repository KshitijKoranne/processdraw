import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Keep demo accounts available, but reset demo-generated diagrams,
// revision snapshots, notifications, and demo audit entries every 6 hours.
crons.interval(
  "reset demo data every 6 hours",
  { hours: 6 },
  internal.demoData.wipeDemoData,
);

export default crons;
