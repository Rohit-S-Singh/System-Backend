// jobs/jobCron.js
import cron from "node-cron";
import {
  syncJobsFromAPI,
  removeExpiredJobs,
} from "../jobs/JobHandlerAdmin.js";

export const startJobCron = () => {
  // ⏰ Every 10 minutes
  cron.schedule("* * * * *", async () => {
    console.log("⏰ Cron triggered");

    await syncJobsFromAPI();
    await removeExpiredJobs();
  });

  console.log("🕒 Job cron scheduled (every 10 min)");
};
