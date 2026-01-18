import express from "express";
import { uploadResume as upload } from "../middleware/multer.js";
import { 
  uploadResume, 
  getMyResumes, 
  deleteResume,
  setMainResume,
  getMainResume 
} from "../controller/resumeController.js";

const router = express.Router();

// Upload resume
router.post("/upload", upload.single("resume"), uploadResume);

// Get all user's resumes
router.get("/my", getMyResumes);

// Get main resume
router.get("/main", getMainResume);

// Set resume as main (NEW ROUTE)
router.put("/:id/set-main", setMainResume);

// Delete resume
router.delete("/:id", deleteResume);

export default router;