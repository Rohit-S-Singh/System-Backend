import User from "../../models/User.js";
import Mentor from "../../models/Mentor.js";
import Recruiter from "../../models/Recruiter.js";
// /**
//  * @desc    Get all users with pending mentor or recruiter requests
//  * @route   GET /api/pending-requests
//  * @access  Admin (protect with middleware later)
//  */
export  const getPendingRequests = async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { mentorStatus: "Pending" },
        { recruiterStatus: "Pending" }
      ]
    })
      .select(
        "_id name email mentorStatus recruiterStatus isMentor isRecruiter"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending requests"
    });
  }
};

export const handleUserRequest = async (req, res) => {
  try {
    const { userId, role, action } = req.params;

    if (!["mentor", "recruiter"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    // =========================
    // 1️⃣ Fetch user
    // =========================
    const user = await User.findById(userId);
console.log(user);
    
    if (!user) {
       console.log("hello");
       

      return res.status(404).json({ success: false, message: "User not found" });
    }

    // =========================
    // 2️⃣ USER SCHEMA UPDATE (SOURCE OF TRUTH)
    // =========================
    if (role === "mentor") {
      if (user.mentorStatus !== "Pending") {
        return res.status(400).json({
          success: false,
          message: "No pending mentor request"
        });
      }

      if (action === "accept") {
        user.isMentor = true;
        user.mentorStatus = "You Are A Mentor";
      } else {
        user.isMentor = false;
        user.mentorStatus = "Become a Mentor";
      }
    }

    if (role === "recruiter") {
      if (user.recruiterStatus !== "Pending") {
        return res.status(400).json({
          success: false,
          message: "No pending recruiter request"
        });
      }

      if (action === "accept") {
        user.isRecruiter = true;
        user.recruiterStatus = "You Are A Recruiter";
      } else {
        user.isRecruiter = false;
        user.recruiterStatus = "Become a Recruiter";
      }
    }

    // 🔒 SAVE USER FIRST (CRITICAL)
    await user.save();



console.log(user);



    // =========================
    // 3️⃣ SYNC ROLE-SPECIFIC MODELS
    // =========================




    /* ---------- Mentor Model ---------- */
    if (role === "mentor") {
      if (action === "accept") {
        await Mentor.findOneAndUpdate(
          { user: user._id },
          {
            user: user._id,
            status: "active",
            isVerified: true
          },
          { upsert: true, new: true }
        );
      } else {
        await Mentor.findOneAndUpdate(
          { user: user._id },
          { status: "inactive" }
        );
      }
    }

    /* ---------- Recruiter Model ---------- */
    if (role === "recruiter") {
      if (action === "accept") {
        await Recruiter.findOneAndUpdate(
          { email: user.email },
          {
            name: user.name,
            email: user.email,
            addedBy: user._id,
            status: "Approved",
            sentAt: new Date()
          },
          { upsert: true, new: true }
        );
      } else {
        await Recruiter.findOneAndUpdate(
          { email: user.email },
          { status: "Rejected" }
        );
      }
    }

    // =========================
    // 4️⃣ RESPONSE
    // =========================
    return res.status(200).json({
      success: true,
      message: `${role} request ${action}ed successfully`
    });

  } catch (error) {
    console.error("Admin request error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while processing request"
    });
  }
};


// export const handleUserRequest = async (req, res) => {
//   try {
//     const { userId, role, action } = req.params;

//     if (!["mentor", "recruiter"].includes(role)) {
//       return res.status(400).json({ success: false, message: "Invalid role" });
//     }

//     if (!["accept", "decline"].includes(action)) {
//       return res.status(400).json({ success: false, message: "Invalid action" });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     /* ======================================================
//        MENTOR FLOW
//     ====================================================== */
//     if (role === "mentor") {
//       if (user.mentorStatus !== "Pending") {
//         return res.status(400).json({
//           success: false,
//           message: "No pending mentor request"
//         });
//       }

//       if (action === "accept") {
//         // User update
//         user.isMentor = true;
//         user.mentorStatus = "You Are A Mentor";

//         // Mentor upsert
//         await Mentor.findOneAndUpdate(
//           { user: user._id },
//           {
//             user: user._id,
//             status: "active",
//             isVerified: true
//           },
//           { upsert: true, new: true }
//         );
//       } else {
//         user.isMentor = false;
//         user.mentorStatus = "Become a Mentor";

//         await Mentor.findOneAndUpdate(
//           { user: user._id },
//           { status: "inactive" }
//         );
//       }
//     }

//     /* ======================================================
//        RECRUITER FLOW
//     ====================================================== */
//     if (role === "recruiter") {
//       if (user.recruiterStatus !== "Pending") {
//         return res.status(400).json({
//           success: false,
//           message: "No pending recruiter request"
//         });
//       }

//       if (action === "accept") {
//         // User update
//         user.isRecruiter = true;
//         user.recruiterStatus = "You Are A Recruiter";

//         // Recruiter upsert
//         await Recruiter.findOneAndUpdate(
//           { email: user.email },
//           {
//             name: user.name,
//             email: user.email,
//             addedBy: user._id,
//             status: "Approved",
//             sentAt: new Date()
//           },
//           { upsert: true, new: true }
//         );
//       } else {
//         user.isRecruiter = false;
//         user.recruiterStatus = "Become a Recruiter";

//         await Recruiter.findOneAndUpdate(
//           { email: user.email },
//           { status: "Rejected" }
//         );
//       }
//     }

//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message: `${role} request ${action}ed successfully`
//     });
//   } catch (error) {
//     console.error("Admin request handler error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while processing request"
//     });
//   }
// };