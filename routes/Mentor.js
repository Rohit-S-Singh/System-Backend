import express from 'express';
import { getMentorDetails } from '../controller/interviews/Interview.js';
const Router = express.Router();

Router.get('/mentor/:mentorId', getMentorDetails);
export default Router; 