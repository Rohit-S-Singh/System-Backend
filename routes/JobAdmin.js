import { Router } from 'express';
import {
  createJob,
  getJobs
} from '../controller/JobHandlerAdmin.js';

const JobRouter = Router();

// Job CRUD routes
JobRouter.post('/', createJob);
JobRouter.get('/', getJobs);
// router.get('/jobs/:id', getJobById);
// router.put('/jobs/:id', updateJob);
// router.delete('/jobs/:id', deleteJob);

// // Referral routes
// router.post('/jobs/:id/referrals', addReferral);
// router.get('/jobs/:id/referrals', getReferralsByJob);

export default JobRouter;
