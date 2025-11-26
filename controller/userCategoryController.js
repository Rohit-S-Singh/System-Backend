import User from "../models/User.js";

export const updateUserCategory = async (req, res) => {
  try {
    const { email, userType, studentDetails, professionalDetails } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!userType || !["student", "professional"].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing userType",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -------------------------------
    //   HANDLE STUDENT CATEGORY
    // -------------------------------
    if (userType === "student") {
      if (!studentDetails) {
        return res.status(400).json({
          success: false,
          message: "studentDetails missing",
        });
      }

      user.userType = "student";
      user.studentDetails = {
        ...studentDetails,
        skills: studentDetails.skills || [],
        preferredLocations: studentDetails.preferredLocations || [],
      };

      user.professionalDetails = undefined; // clear opposite
    }

    // -------------------------------
    //   HANDLE PROFESSIONAL CATEGORY
    // -------------------------------
    if (userType === "professional") {
      if (!professionalDetails) {
        return res.status(400).json({
          success: false,
          message: "professionalDetails missing",
        });
      }

      user.userType = "professional";
      user.professionalDetails = {
        ...professionalDetails,
        skills: professionalDetails.skills || [],
        preferredLocations: professionalDetails.preferredLocations || [],
      };

      user.studentDetails = undefined; // clear opposite
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user,
    });

  } catch (error) {
    console.error("Error updating user category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
