import { getRecommendedJobs } from "../services/matchingService.js";
import Resume from "../models/Resume.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { processResumeWithAI } from "../services/aiService.js";
import ResumeEmbedding from "../models/ResumeEmbedding.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);






export const getRecommendedJobsForUser = async (req, res) => {
  try {
    const userId = req.user._id; // from auth
    const limit = Number(req.query.limit) || 20;

    const results = await getRecommendedJobs(userId, limit);

    return res.status(200).json({
      success: true,
      count: results.length,
      jobs: results
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


/**
 * Upload a new resume
 * @route POST /api/resumes/upload
 */
export const uploadResume = async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const fileType = file.mimetype === "application/pdf" ? "pdf" : "docx";
    const fileSize = Math.round(file.size / 1024);

    // Check if this is the user's first resume
    const existingResumes = await Resume.find({ userId });
    const isFirstResume = existingResumes.length === 0;

    // Create new resume
    const newResume = new Resume({
      userId,
      fileName: file.originalname,
      fileUrl: `/uploads/resumes/${file.filename}`,
      fileType,
      fileSize,
      isMain: isFirstResume,
    });

    await newResume.save();

    // 🔥 AI runs ONLY if this is the MAIN resume
    if (newResume.isMain) {
      const absolutePath = path.join(__dirname, "..", newResume.fileUrl);

      try {
        const aiResult = await processResumeWithAI({
          filePath: absolutePath,
          resumeId: newResume._id.toString(),
          userId
        });

await ResumeEmbedding.findOneAndUpdate(
  { resumeId: newResume._id },
  {
    userId,
    resumeId: newResume._id,
    embedding: aiResult.embedding,
    previewText: aiResult.preview_text
  },
  { upsert: true, new: true }
);

console.log("Resume embedding stored in DB");


      } catch (aiError) {
        console.error("AI processing failed:", aiError.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: newResume.isMain
        ? "Main resume uploaded & sent for AI processing"
        : "Resume uploaded successfully",
      resume: newResume,
    });

  } catch (error) {
    console.error("Error uploading resume:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while uploading resume",
      error: error.message,
    });
  }
};


/**
 * Get all resumes for a user
 * @route GET /api/resumes/my?userId=xxx
 */
export const getMyResumes = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      resumes,
      count: resumes.length,
    });
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching resumes",
      error: error.message,
    });
  }
};


/**
 * Get user's main resume
 * @route GET /api/resumes/main?userId=xxx
 */
export const getMainResume = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const mainResume = await Resume.findOne({ userId, isMain: true });

    if (!mainResume) {
      return res.status(404).json({
        success: false,
        message: "No main resume found",
      });
    }

    return res.status(200).json({
      success: true,
      resume: mainResume,
    });
  } catch (error) {
    console.error("Error fetching main resume:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching main resume",
      error: error.message,
    });
  }
};


/**
 * Set a resume as the main resume
 * @route PUT /api/resumes/:id/set-main
 */
export const setMainResume = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    if (resume.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: This resume does not belong to you",
      });
    }

    // Set all to false
    await Resume.updateMany({ userId }, { $set: { isMain: false } });

    // Set selected resume as main
    resume.isMain = true;
    await resume.save();

    // 🔥 Re-run AI because main resume changed
    const absolutePath = path.join(__dirname, "..", resume.fileUrl);

    try {
      const aiResult = await processResumeWithAI({
        filePath: absolutePath,
        resumeId: resume._id.toString(),
        userId
      });

    await ResumeEmbedding.findOneAndUpdate(
  { resumeId: resume._id },
  {
    userId,
    resumeId: resume._id,
    embedding: aiResult.embedding,
    previewText: aiResult.preview_text
  },
  { upsert: true, new: true }
);

console.log("Updated resume embedding in DB");


    } catch (aiError) {
      console.error("AI reprocessing failed:", aiError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Main resume set successfully and sent for AI processing",
      resume: {
        _id: resume._id,
        fileName: resume.fileName,
        isMain: resume.isMain,
      },
    });

  } catch (error) {
    console.error("Error setting main resume:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while setting main resume",
      error: error.message,
    });
  }
};


/**
 * Delete a resume
 * @route DELETE /api/resumes/:id
 */
export const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;

    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    const filePath = path.join(__dirname, "..", resume.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // If deleted was main, set another as main
    if (resume.isMain) {
      const anotherResume = await Resume.findOne({
        userId: resume.userId,
        _id: { $ne: id },
      });

      if (anotherResume) {
        anotherResume.isMain = true;
        await anotherResume.save();

        // 🔥 Trigger AI for new auto-main resume
        const newMainPath = path.join(__dirname, "..", anotherResume.fileUrl);

        try {
          await processResumeWithAI({
            filePath: newMainPath,
            resumeId: anotherResume._id.toString(),
            userId: resume.userId.toString()
          });
        } catch (e) {
          console.error("AI failed after auto main switch:", e.message);
        }
      }
    }

    await Resume.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting resume:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting resume",
      error: error.message,
    });
  }
};
