// routes/recruiterRoutes.js
import express from 'express';
import { requestRecruiter, getUserRecruiters, createRecruiter, syncRecruitersFromSheet, deleteRecruiter, bulkDeleteRecruiters } from '../controller/Recruiter.js';
import authenticateToken from '../middleware/index.js';

const router = express.Router();

router.post('/request-recruiter/:email', requestRecruiter);
router.get('/', getUserRecruiters);
router.post('/', createRecruiter);
router.post('/sync-sheet', syncRecruitersFromSheet);
router.post('/bulk-delete', authenticateToken, bulkDeleteRecruiters);
router.delete('/:id', authenticateToken, deleteRecruiter);

export default router;