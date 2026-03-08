import mongoose from "mongoose";
import RequestInterview from "../models/interview/InterviewRequest.js";
import InterviewScheduled from "../models/interview/interviewSchedule.js";

export const processInterviewRequest = async ({ token, action }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Find request
    const request = await RequestInterview.findOne({ token }).session(session);

    if (!request) {
      throw new Error("Invalid or expired link");
    }

    if (request.tokenExpiresAt && request.tokenExpiresAt < Date.now()) {
      throw new Error("Link expired");
    }

    if (request.status !== "pending") {
      throw new Error("Request already processed");
    }

    // 2️⃣ Accept logic
    if (action === "accept") {
      const scheduled = await InterviewScheduled.create(
        [
          {
            mentor: request.mentor,
            user: request.user,
            date: request.date,
            day: request.day,
            time: request.time,
            duration: request.duration,
            message: request.message,
            additionalDetails: request.additionalDetails,
            status: "scheduled",
          },
        ],
        { session }
      );

      // Auto-delete after 1 hour (same logic, but safe)
      const interviewDate = new Date(request.date);
      const deleteTime = interviewDate.getTime() + 60 * 60 * 1000;
      const delay = deleteTime - Date.now();

      if (delay > 0) {
        setTimeout(async () => {
          await InterviewScheduled.findByIdAndDelete(scheduled[0]._id);
        }, delay);
      }
    }

    // 3️⃣ Delete interview request
    await RequestInterview.findByIdAndDelete(request._id).session(session);

    // 4️⃣ Commit
    await session.commitTransaction();
    return {
       mentorid: request.mentor,
       userid: request.user,
            date: request.date,
            day: request.day,
            time: request.time,
            duration: request.duration,
            message: request.message,
            additionalDetails: request.additionalDetails,
    };

  } catch (error) {
    // 🔥 Rollback everything
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
