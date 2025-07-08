// routes/recruiterRoutes.js
import express from 'express';
import { addRecruiter, getUserRecruiters } from '../controller/Recruiter.js';
// import { protect } from '../middleware/index.js';÷

const router = express.Router();

router.post('/', addRecruiter);
router.get('/', getUserRecruiters);

export default router;