import Resume from "../models/Resume.js";
import { storeFile } from "../services/fileStorage.js";
import { extractResumeText } from "../services/extractResumeText.js";
import { parseResumeText } from "../services/parseResume.js";

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ errorMessage: "No file uploaded" });
    }

    // 1️⃣ Store original file
    const storedFile = await storeFile(req.file, req.user.userId);

    // 2️⃣ Extract text
    // const rawText = await extractResumeText(req.file);

    // 3️⃣ Parse resume
    // const parsedContent = parseResumeText(rawText);

    // 4️⃣ Save resume
    const resume = await Resume.create({
      userId: req.user.userId,
      type: "uploaded",
      originalFile: {
        url: storedFile.url,
        fileType: storedFile.fileType,
        uploadedAt: new Date(),
      },
      content: null,
    });

    return res.status(200).json({
      success: true,
      message: "Resume uploaded successfully",
      resume,
    });
  } catch (error) {
    console.error("Resume Upload Error:", error);
    return res.status(500).json({
      errorMessage: "Resume upload failed",
    });
  }
};

export const getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      resumes,
      activeResumeId: req.user.activeResume,
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: "Failed to fetch resumes",
    });
  }
};

export const setActiveResume = async (req, res) => {
  try {
    const { resumeId } = req.body;

    const resume = await Resume.findOne({
      _id: resumeId,
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        errorMessage: "Resume not found",
      });
    }

    req.user.activeResume = resumeId;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: "Active resume updated",
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: "Failed to set active resume",
    });
  }
};

export const getActiveResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.user.activeResume,
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        errorMessage: "Active resume not found",
      });
    }

    res.status(200).json({
      success: true,
      resume,
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: "Failed to fetch active resume",
    });
  }
};
export const getMyResume = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.userId }).lean();

    if (!resumes || resumes.length === 0) {
      return res.status(200).json({
        success: true,
        resumes: []
      });
    }

    return res.status(200).json({
      success: true,
      resumes
    });
  } catch (error) {
    console.error("Get resume error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch resumes"
    });
  }
};
