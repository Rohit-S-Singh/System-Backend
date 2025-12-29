import User from "../../models/User.js";
import Mentor from "../../models/Mentor.js";
import Recruiter from "../../models/Recruiter.js";

import PendingMentorRequest from "../../models/PendingMentorRequest.js";






export const getPendingRequests = async (req, res) => {
  console.log("kkkkkk");
  
  try {
    const pendingRequests = await PendingMentorRequest.find({
      status: "pending"
    })
      .populate({
        path: "userId",
        select: "_id name email mentorStatus isMentor"
      })
      .populate({
        path: "mentorId",
        select: "_id"
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      requests: pendingRequests
    });
  } catch (error) {
    console.error("Error fetching pending mentor requests:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending mentor requests"
    });
  }
};



export const handleUserRequest = async (req, res) => {
  try {
    let { userId, role, action } = req.params;

    role = role.toLowerCase();
    action = action.toLowerCase();

    /* ===============================
       VALIDATION
    =============================== */
    if (!["mentor", "recruiter"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action"
      });
    }

    /* ===============================
       FETCH USER
    =============================== */
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    /* ===============================
       MENTOR REQUEST
    =============================== */
    if (role === "mentor") {
      if (user.mentorStatus !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Mentor request already processed"
        });
      }

      if (action === "accept") {
        // USER
        user.mentorStatus = "approved";

        // MENTOR
        await Mentor.findOneAndUpdate(
          { userId: user._id },
          {
            status: "active",
            approvedByAdmin: true
          },
          { new: true }
        );

        // PENDING REQUEST
        await PendingMentorRequest.findOneAndUpdate(
          { userId: user._id },
          {
            status: "approved",
            reviewedAt: new Date()
          }
        );
      } else {
        user.mentorStatus = "rejected";

        await Mentor.findOneAndUpdate(
          { userId: user._id },
          { status: "inactive" }
        );

        await PendingMentorRequest.findOneAndUpdate(
          { userId: user._id },
          {
            status: "rejected",
            reviewedAt: new Date()
          }
        );
      }
    }

    /* ===============================
       RECRUITER REQUEST
    =============================== */
    if (role === "recruiter") {
      if (user.recruiterStatus !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Recruiter request already processed"
        });
      }

      user.recruiterStatus =
        action === "accept" ? "approved" : "rejected";
    }

    /* ===============================
       SAVE USER
    =============================== */
    await user.save();

    return res.status(200).json({
      success: true,
      message: `${role} request ${action}ed successfully`
    });

  } catch (error) {
    console.error("Admin request error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
