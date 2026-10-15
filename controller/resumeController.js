import Resume from "../models/Resume.js";
import User from "../models/User.js";
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

    // A user's first resume becomes their main one automatically.
    const existingCount = await Resume.countDocuments({ userId: req.user.userId });

    // 4️⃣ Save resume
    const resume = await Resume.create({
      userId: req.user.userId,
      type: "uploaded",
      originalFile: {
        url: storedFile.url,
        fileType: storedFile.fileType,
        uploadedAt: new Date(),
      },
      fileName: req.file.originalname,
      fileSize: Math.round((req.file.size / 1024) * 100) / 100, // KB
      fileType: storedFile.fileType,
      fileUrl: storedFile.url,
      isMain: existingCount === 0,
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
    const resumes = await Resume.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });

    const user = await User.findById(req.user.userId).lean();

    res.status(200).json({
      success: true,
      resumes,
      activeResumeId: user?.activeResume || null,
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
      userId: req.user.userId,
    });

    if (!resume) {
      return res.status(404).json({
        errorMessage: "Resume not found",
      });
    }

    // req.user is the decoded JWT payload, not a Mongoose document — update
    // the actual User record instead of trying to .save() the token.
    await User.findByIdAndUpdate(req.user.userId, { activeResume: resumeId });

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
    const user = await User.findById(req.user.userId).lean();

    const resume = user?.activeResume
      ? await Resume.findOne({ _id: user.activeResume, userId: req.user.userId })
      : null;

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

export const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;

    const resume = await Resume.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }

    return res.status(200).json({ success: true, message: "Resume deleted" });
  } catch (error) {
    console.error("Delete resume error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete resume" });
  }
};

export const setMainResume = async (req, res) => {
  try {
    const { id } = req.params;

    const resume = await Resume.findOne({ _id: id, userId: req.user.userId });
    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }

    await Resume.updateMany({ userId: req.user.userId }, { $set: { isMain: false } });
    resume.isMain = true;
    await resume.save();

    return res.status(200).json({ success: true, message: "Main resume updated" });
  } catch (error) {
    console.error("Set main resume error:", error);
    return res.status(500).json({ success: false, message: "Failed to set main resume" });
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
