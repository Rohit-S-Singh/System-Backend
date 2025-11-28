// routes/recruiterRoutes.js
import express from 'express';
import { requestRecruiter, getUserRecruiters, createRecruiter } from '../controller/Recruiter.js';
// import { protect } from '../middleware/index.js';÷

const router = express.Router();

router.post('/request-recruiter/:email', requestRecruiter);
router.get('/', getUserRecruiters);
router.post('/', createRecruiter);

export default router;