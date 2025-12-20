// jobs/jobCron.js
import cron from "node-cron";
import {
  syncJobsFromAPI,
  removeExpiredJobs,
} from "../jobs/JobHandlerAdmin";

export const startJobCron = () => {
  // ⏰ Every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    console.log("⏰ Cron triggered");

    await syncJobsFromAPI();
    await removeExpiredJobs();
  });

  console.log("🕒 Job cron scheduled (every 6 hours)");
};
