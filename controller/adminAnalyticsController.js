import Visitor from "../models/Visitor.js";
import User from "../models/User.js";
import Mentor from "../models/Mentor.js";
import InterviewHistory from "../models/interview/InterviewHistory.js";
import EmailLog from "../models/EmailLogs.js";
import Job from "../models/Job.js";

const percentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

export const getAdminAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 28;
    const now = new Date();

    const currentStart = new Date();
    currentStart.setDate(now.getDate() - days);

    const previousStart = new Date();
    previousStart.setDate(now.getDate() - days * 2);

    /* =========================
       UNIQUE VISITORS
    ========================= */
    const [currentVisitors, previousVisitors] = await Promise.all([
      Visitor.aggregate([
        { $match: { visitedAt: { $gte: currentStart } } },
        { $group: { _id: { ip: "$ip", ua: "$userAgent" } } },
        { $count: "count" },
      ]),
      Visitor.aggregate([
        {
          $match: {
            visitedAt: { $gte: previousStart, $lt: currentStart },
          },
        },
        { $group: { _id: { ip: "$ip", ua: "$userAgent" } } },
        { $count: "count" },
      ]),
    ]);

    /* =========================
       USERS REGISTERED
    ========================= */
    const [usersNow, usersPrev] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: currentStart } }),
      User.countDocuments({
        createdAt: { $gte: previousStart, $lt: currentStart },
      }),
    ]);

    /* =========================
       INTERVIEWS TAKEN
    ========================= */
    const [interviewsNow, interviewsPrev] = await Promise.all([
      InterviewHistory.countDocuments({
        status: "completed",
        createdAt: { $gte: currentStart },
      }),
      InterviewHistory.countDocuments({
        status: "completed",
        createdAt: { $gte: previousStart, $lt: currentStart },
      }),
    ]);

    /* =========================
       COLD EMAILS SENT
    ========================= */
    const [emailsNow, emailsPrev] = await Promise.all([
      EmailLog.countDocuments({ createdAt: { $gte: currentStart } }),
      EmailLog.countDocuments({
        createdAt: { $gte: previousStart, $lt: currentStart },
      }),
    ]);

    /* =========================
       RECRUITERS REGISTERED
    ========================= */
    const [recruitersNow, recruitersPrev] = await Promise.all([
      User.countDocuments({
        recruiterStatus: "Approved",
        createdAt: { $gte: currentStart },
      }),
      User.countDocuments({
        recruiterStatus: "Approved",
        createdAt: { $gte: previousStart, $lt: currentStart },
      }),
    ]);

    /* =========================
       MENTORS REGISTERED
    ========================= */
    const [mentorsNow, mentorsPrev] = await Promise.all([
      Mentor.countDocuments({
        approvedByAdmin: true,
        status: "active",
        createdAt: { $gte: currentStart },
      }),
      Mentor.countDocuments({
        approvedByAdmin: true,
        status: "active",
        createdAt: { $gte: previousStart, $lt: currentStart },
      }),
    ]);

    /* =========================
       ACTIVE JOBS
    ========================= */
    const activeJobs = await Job.countDocuments({
      isActive: true,
      status: "Open",
    });

    /* =========================
       RESPONSE
    ========================= */
    return res.status(200).json({
      success: true,
      analytics: {
        uniqueVisitors: {
          value: currentVisitors[0]?.count || 0,
          change: percentageChange(
            currentVisitors[0]?.count || 0,
            previousVisitors[0]?.count || 0
          ),
        },

        usersRegistered: {
          value: usersNow,
          change: percentageChange(usersNow, usersPrev),
        },

        interviewsTaken: {
          value: interviewsNow,
          change: percentageChange(interviewsNow, interviewsPrev),
        },

        coldEmailsSent: {
          value: emailsNow,
          change: percentageChange(emailsNow, emailsPrev),
        },

        recruitersRegistered: {
          value: recruitersNow,
          change: percentageChange(recruitersNow, recruitersPrev),
        },

        mentorsRegistered: {
          value: mentorsNow,
          change: percentageChange(mentorsNow, mentorsPrev),
        },

        activeJobs: {
          value: activeJobs,
          change: 0, // snapshot metric
        },
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
};
