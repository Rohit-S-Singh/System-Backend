// cron/interviewReminderCron.js
import cron from "node-cron";
import InterviewScheduled from "../models/interview/interviewSchedule.js";
import { sendMail } from "../utils/sendMail.js";

// helper to combine date + time
const getInterviewDateTime = (date, time) => {
  const d = new Date(date);
  const [hours, minutes] = time.split(":");
  d.setHours(parseInt(hours));
  d.setMinutes(parseInt(minutes));
  d.setSeconds(0);
  return d;
};

export const startInterviewReminderCron = () => {
  cron.schedule("* * * * *", async () => {
    try {
      console.log("⏰ Checking upcoming interviews...");

      const interviews = await InterviewScheduled.find({
        status: "scheduled"
      })
        .populate("user", "name email")
        .populate("mentor", "name email");

      const now = new Date();

      for (let interview of interviews) {
        const interviewTime = getInterviewDateTime(interview.date, interview.time);
        const diffMs = interviewTime - now;
        const diffMin = Math.floor(diffMs / 60000);

        // ✅ 10 min reminder
        if (diffMin <= 10 && diffMin > 2 && !interview.reminder10MinSent) {
          await sendMail({
            to: [interview.user.email, interview.mentor.email],
            subject: "⏳ Interview Reminder - 10 minutes left",
            html: `
              <h3>Interview Reminder</h3>
              <p>Hello ${interview.user.name} & ${interview.mentor.name},</p>
              <p>Your interview will start in <b>10 minutes</b>.</p>
              <p>Please be prepared.</p>
            `
          });

          interview.reminder10MinSent = true;
          await interview.save();
        }

        // ✅ 2 min reminder with meet link
        if (diffMin <= 2 && diffMin >= 0 && !interview.reminder2MinSent) {
          await sendMail({
            to: [interview.user.email, interview.mentor.email],
            subject: "🚀 Interview Starting Soon - Join Link",
            html: `
              <h3>Your interview is about to start</h3>
              <p>Starts in <b>2 minutes</b>.</p>
              <p><b>Join meeting:</b></p>
              <a href="${interview.meetLink}">${interview.meetLink}</a>
            `
          });

          interview.reminder2MinSent = true;
          await interview.save();
        }
      }
    } catch (err) {
      console.error("❌ Interview reminder cron error:", err.message);
    }
  });
};
