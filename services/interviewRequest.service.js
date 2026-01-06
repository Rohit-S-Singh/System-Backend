import mongoose from "mongoose";
import RequestInterview from "../models/interview/InterviewRequest.js";
import InterviewScheduled from "../models/interview/interviewSchedule.js";

export const processInterviewRequest = async ({ token, action }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const request = await RequestInterview.findOne({ token }).session(session);

    if (!request) throw new Error("Invalid or expired link");
    if (request.tokenExpiresAt && request.tokenExpiresAt < Date.now()) throw new Error("Link expired");
    if (request.status !== "pending") throw new Error("Request already processed");

    let scheduledInterview = null;

    if (action === "accept") {
      const [scheduled] = await InterviewScheduled.create(
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

      scheduledInterview = scheduled;
    }

    await RequestInterview.findByIdAndDelete(request._id).session(session);

    await session.commitTransaction();

    // ✅ IMPORTANT
    if (action === "accept") return scheduledInterview;
    return request;

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
