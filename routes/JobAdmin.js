import { Router } from 'express';

import { ingestJobFromExtension, getRandomJobs,getJobsBySkillMatch ,filterJobs ,getJobDetails, createJob ,deleteJobById,getSavedJobs,removeSavedJob ,saveJob} from '../controller/jobs/JobHandlerAdmin.js';
const JobRouter = Router();

// Job CRUD routes
JobRouter.get('/random', getRandomJobs);
JobRouter.post('/by-skill-match', getJobsBySkillMatch);
JobRouter.get('/filter', filterJobs);
JobRouter.get("/jobs/:jobId", getJobDetails);
JobRouter.post('/create', createJob);
JobRouter.delete('/delete/:jobId', deleteJobById);
// Get all saved jobs
JobRouter.get("/saved/:userId",  getSavedJobs);
JobRouter.post("/save",  saveJob);
// Remove saved job
JobRouter.delete("/remove", removeSavedJob);


JobRouter.post("/ingest", ingestJobFromExtension);
export default JobRouter;
