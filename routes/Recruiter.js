import express from "express";
import { requestRecruiter, getUserRecruiters, addRecruiter } from "../controller/Recruiter.js";

const router = express.Router();

// ADD recruiter contact (Excel + manual add)
router.post("/", addRecruiter);

// FETCH recruiters for email tool
router.get("/", getUserRecruiters);

// recruiter onboarding (keep separate)
router.post("/request-recruiter/:email", requestRecruiter);

export default router;
