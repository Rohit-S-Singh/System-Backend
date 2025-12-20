import { Router } from 'express';

import { getRandomJobs,getJobsBySkillMatch ,filterJobs ,getJobDetails, createJob ,deleteJobById} from '../controller/jobs/JobHandlerAdmin.js';
const JobRouter = Router();

// Job CRUD routes
JobRouter.get('/random', getRandomJobs);
JobRouter.post('/by-skill-match', getJobsBySkillMatch);
JobRouter.get('/filter', filterJobs);
JobRouter.get("/jobs/:jobId", getJobDetails);
JobRouter.post('/create', createJob);
JobRouter.delete('/delete/:jobId', deleteJobById);

export default JobRouter;
