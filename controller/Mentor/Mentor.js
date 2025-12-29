// controllers/mentorController.js
import Mentor from "../../models/Mentor.js";
import PendingMentorRequest from "../../models/PendingMentorRequest.js";
import User from "../../models/User.js";
// controllers/mentorController

import mongoose from "mongoose";

// export const requestBecomeMentor = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const {
//       userId,
//       name,
//       email,
//       phone,
//       avatar,
//       expertise,
//       experience,
//       bio,
//       pricePerHour,
//       interviewTypes
//     } = req.body;

//     /* ===============================
//        BASIC VALIDATION
//     =============================== */
//     if (!userId || !name || !email || !phone || !expertise || !experience || !pricePerHour) {
//       await session.abortTransaction();
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     /* ===============================
//        PREVENT DUPLICATE MENTOR
//     =============================== */
//     const existingMentor = await Mentor.findOne({ userId }).session(session);
//     if (existingMentor) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         message: "Mentor already exists or request already submitted"
//       });
//     }

//     /* ===============================
//        PREVENT MULTIPLE PENDING REQUESTS
//     =============================== */
//     const existingRequest = await PendingMentorRequest.findOne({
//       userId,
//       status: "pending"
//     }).session(session);

//     if (existingRequest) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         message: "Mentor request is already pending approval"
//       });
//     }

//     /* ===============================
//        1️⃣ CREATE MENTOR (PENDING)
//     =============================== */
//     const mentor = await Mentor.create(
//       [{
//         userId,
//         name,
//         email,
//         phone,
//         avatar,
//         expertise,
//         experience,
//         bio,
//         pricePerHour,
//         interviewTypes,
//         status: "pending",
//         approvedByAdmin: false
//       }],
//       { session }
//     );

//     /* ===============================
//        2️⃣ CREATE PENDING REQUEST
//     =============================== */
//     await PendingMentorRequest.create(
//       [{
//         userId,
//         mentorId: mentor[0]._id,
//         status: "pending"
//       }],
//       { session }
//     );

//     /* ===============================
//        3️⃣ UPDATE USER STATUS
//     =============================== */
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { mentorStatus: "pending" },
//       { new: true, session }
//     );

//     if (!updatedUser) {
//       throw new Error("User not found");
//     }

//     /* ===============================
//        COMMIT TRANSACTION
//     =============================== */
//     await session.commitTransaction();
//     session.endSession();

//     return res.status(200).json({
//       message: "Mentor request submitted successfully. Await admin approval.",
//       mentorId: mentor[0]._id
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();

//     console.error("Become mentor error:", error);
//     return res.status(500).json({
//       message: "Failed to submit mentor request"
//     });
//   }
// };



export const requestBecomeMentor = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      userId,
      name,
      email,
      phone,
      avatar,
      expertise,
      experience,
      bio,
      pricePerHour,
      interviewTypes
    } = req.body;

console.log("----==========================================================================-------------------");

    console.log(userId,
      name,
      email,
      phone,
      avatar,
      expertise,
      experience,
      bio,
      pricePerHour,
      interviewTypes)

console.log("----==========================================================================-------------------");



    /* ===============================
       BASIC VALIDATION
    =============================== */
    if (
      !userId ||
      !name ||
      !email ||
      !phone ||
      !Array.isArray(expertise) ||
      expertise.length === 0 ||
      experience === undefined ||
      pricePerHour === undefined
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Missing or invalid required fields" });
    }

    /* ===============================
       PREVENT DUPLICATE MENTOR
    =============================== */
    const existingMentor = await Mentor.findOne({ userId }).session(session);
    if (existingMentor) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Mentor already exists or request already submitted"
      });
    }

    /* ===============================
       PREVENT MULTIPLE PENDING REQUESTS
    =============================== */
    const existingRequest = await PendingMentorRequest.findOne({
      userId,
      status: "pending" // ✅ FIXED
    }).session(session);

    if (existingRequest) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Mentor request is already pending approval"
      });
    }

    /* ===============================
       CREATE MENTOR (PENDING)
    =============================== */
    const mentor = await Mentor.create(
      [
        {
          userId,
          name,
          email,
          phone,
          avatar,
          expertise,
          experience,
          bio,
          pricePerHour,
          interviewTypes,
          status: "pending",
          approvedByAdmin: false
        }
      ],
      { session }
    );

    /* ===============================
       CREATE PENDING REQUEST
    =============================== */
    await PendingMentorRequest.create(
      [
        {
          userId,
          mentorId: mentor[0]._id,
          status: "pending"
        }
      ],
      { session }
    );

    /* ===============================
       UPDATE USER STATUS
    =============================== */
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { mentorStatus: "pending" },
      { new: true, session }
    );

    if (!updatedUser) {
      throw new Error("User not found");
    }

    /* ===============================
       COMMIT TRANSACTION
    =============================== */
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Mentor request submitted successfully. Await admin approval.",
      mentorId: mentor[0]._id
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Become mentor error:", error);
    return res.status(500).json({
      message: "Failed to submit mentor request"
    });
  }
};



export const getApprovedActiveMentors = async (req, res) => {
  
  try {
    const mentors = await Mentor.find(
      {
        status: "active",
        approvedByAdmin: true,
        isDeleted: false
      },
      {
        _id: 1,
        name: 1,
        email: 1,
        avatar: 1,
        expertise: 1,
        experience: 1,
        pricePerHour: 1
      }
    ).sort({ rating: -1, completedInterviews: -1 });

  console.log("Fetching approved active mentors...", mentors);


    return res.status(200).json({
      success: true,
      count: mentors.length,
      mentors
    });
  } catch (error) {
    console.error("Error fetching approved mentors:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch approved mentors"
    });
  }
};

export const getMentorDetails = async (req, res) => {
  try {
    const { mentorId } = req.params;

    const mentor = await Mentor.findById(mentorId)
      .populate("userId"); // populates full user document (no field limit)

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
      });
    }
    console.log(`Mentor Details: ${mentor}`);
    

    return res.status(200).json({
      success: true,
      mentor,
    });
  } catch (error) {
    console.error("Get Mentor Details Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentor details",
    });
  }
};


