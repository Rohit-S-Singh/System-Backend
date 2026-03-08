
import UserProfile from "../../models/profile/UserProfile.js";
import User from "../../models/User.js";

export const getProfileByUserId = async (req, res) => {
        console.log("Fetching profile for userId:");

  try {
    const { userId } = req.params;
    console.log("Fetching profile for userId:", userId);
    // Try to find the profile
    let profile = await UserProfile.findOne({ userId });
   
   
    // If profile doesn't exist, create one with default/empty values
    if (!profile) {
 
        const user = await User.findById(userId);

      profile = new UserProfile({
        userId,
        userType: user?.userType || "student", // default if not available
        name: user?.name || "Unknown Name",
        email: user?.email ,
        phone: user?.phone || "",
        picture: user?.picture || "",
        coverImage: "",
        bio: "",
        stats: {
          profileViews: 0,
          connections: 0,
          endorsements: 0,
          projects: 0
        },
        details: {
          company: "",
          logo: "",
          title: "",
          experience: "",
          location: "",
          ctc: "",
          expectedCTC: "",
          notice: "",
          workMode: "",
          skills: [],
          github: "",
          linkedin: "",
          portfolio: ""
        },
        experience: [],
        projects: [],
        certs: [],
        achievements: [],
        recommendations: []
      });

      await profile.save();
    }

    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const updateProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId },                 // 🔑 match by userId
      { $set: updateData },       // update only sent fields
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    res.status(200).json({
      success: true,
      profile: updatedProfile
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
};

export const upsertProfile = async (req, res) => {
  try {
    const { userId, userType } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required in request body",
      });
    }

    if (!userType || !["student", "professional"].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing userType",
      });
    }

    // ============================
    // COMMON DATA PARSING
    // ============================
    const skills =
      typeof req.body.skills === "string"
        ? req.body.skills.split(",").map((s) => s.trim())
        : [];

    const preferredLocations =
      typeof req.body.preferredLocations === "string"
        ? req.body.preferredLocations.split(",").map((l) => l.trim())
        : [];

    // ============================
    // STUDENT PROFILE
    // ============================
    if (userType === "student") {
      const studentData = {
        userId,
        college: req.body.college,
        collegeWebsite: req.body.collegeWebsite,
        university: req.body.university,
        degree: req.body.degree,
        branch: req.body.branch,
        year: req.body.year,
        graduationYear: req.body.graduationYear,
        currentCGPA: req.body.currentCGPA,
        tenthPercentage: req.body.tenthPercentage,
        twelfthPercentage: req.body.twelfthPercentage,
        leetcode: req.body.leetcode,
        codeforces: req.body.codeforces,
        portfolioLink: req.body.portfolioLink,
        github: req.body.github,
        careerInterest: req.body.careerInterest,
        preferredJobRole: req.body.preferredJobRole,
        skills,
        preferredLocations,
      };

      const studentProfile = await Student.findOneAndUpdate(
        { userId },
        { $set: studentData },
        { new: true, upsert: true }
      );

      // 🔄 Update userType in User schema
      await User.findByIdAndUpdate(userId, {
        userType: "student",
      });

      return res.status(200).json({
        success: true,
        message: "Student profile saved successfully",
        data: studentProfile,
      });
    }

    // ============================
    // PROFESSIONAL PROFILE
    // ============================
    if (userType === "professional") {
      const professionalData = {
        userId,
        company: req.body.company,
        companyWebsite: req.body.companyWebsite,
        jobTitle: req.body.jobTitle,
        department: req.body.department,
        experience: req.body.experience,
        currentCTC: req.body.currentCTC,
        expectedCTC: req.body.expectedCTC,
        noticePeriod: req.body.noticePeriod,
        portfolioLink: req.body.portfolioLink,
        github: req.body.github,
        linkedin: req.body.linkedin,
        careerLevel: req.body.careerLevel,
        workMode: req.body.workMode,
        preferredJobRole: req.body.preferredJobRole,
        skills,
        preferredLocations,
      };

      const professionalProfile = await Professional.findOneAndUpdate(
        { userId },
        { $set: professionalData },
        { new: true, upsert: true }
      );

      // 🔄 Update userType in User schema
      await User.findByIdAndUpdate(userId, {
        userType: "professional",
      });

      return res.status(200).json({
        success: true,
        message: "Professional profile saved successfully",
        data: professionalProfile,
      });
    }
  } catch (error) {
    console.error("Profile Upsert Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const setupProfile = async (req, res) => {
  console.log("setupProfile called with body:", req.body);

  try {
    const {
      userId,
      userType,
      studentDetails,
      professionalDetails,
      details,
      name,
      email,
    } = req.body;

    // ✅ Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    // ✅ Validate userType
    if (!["student", "working_professional"].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type",
      });
    }

    // 🔍 Check if profile already exists
    let profile = await UserProfile.findOne({ userId });

    if (profile) {
      // ================= UPDATE PROFILE =================
      profile.userType = userType;

      if (userType === "student" && studentDetails) {
        profile.studentDetails = {
          ...profile.studentDetails,
          ...studentDetails,
        };
        profile.professionalDetails = undefined;
        profile.markModified("professionalDetails");
      }

      if (userType === "working_professional" && professionalDetails) {
        profile.professionalDetails = {
          ...profile.professionalDetails,
          ...professionalDetails,
        };
        profile.studentDetails = undefined;
        profile.markModified("studentDetails");
      }

      if (details) {
        profile.details = { ...profile.details, ...details };
      }

      await profile.save();

      // ================= UPDATE USER =================
      await User.findByIdAndUpdate(
        userId,
        { userType },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: profile,
      });
    }

    // ================= CREATE PROFILE =================
    const newProfileData = {
      userId,
      userType,
      name,
      email,
      details: details || {},
    };

    if (userType === "student") {
      newProfileData.studentDetails = studentDetails || {};
    } else {
      newProfileData.professionalDetails = professionalDetails || {};
    }

    profile = new UserProfile(newProfileData);
    await profile.save();

    // ================= UPDATE USER =================
    await User.findByIdAndUpdate(
      userId,
      { userType },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Profile created successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Error in setupProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while setting up profile",
      error: error.message,
    });
  }
};


export const updateUserProfile = async (req, res) => {
  console.log("222222222222222222222222222222222222");
  
  try {
    const { userId, ...updateData } = req.body;

    // ❌ userId is mandatory
    if (!userId) {
        console.log("222222222222222222222222222222222222");

      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    /**
     * 🔒 Prevent updating restricted fields
     */
    delete updateData._id;
    delete updateData.email;
    delete updateData.stats;

    /**
     * 🧠 Normalize skills if needed
     */
    if (updateData.details?.skills && typeof updateData.details.skills === "string") {
      updateData.details.skills = updateData.details.skills
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    }

    /**
     * 🧩 Update profile using userId from body
     */
    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }
      console.log("1111111111111111111111111")

    return res.status(200).json({
      
      success: true,
      message: "Profile updated successfully",
      profile: updatedProfile
    });

  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message
    });
  }
};




