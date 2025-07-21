// controllers/jobController.js

import Jobs from "../models/Jobs.js";

const createJob = async (req, res) => {
  try {
    const {
      userId,
      title,
      company,
      jobType,
      openings,
      category,
      link,
      referralInstructions
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID (postedBy) is required' });
    }

    const jobData = {
      title,
      company,
      jobType,
      openings,
      category,
      link,
      referralInstructions,
      postedBy: userId
    };

    const newJob = new Jobs(jobData);
    const savedJob = await newJob.save();

    res.status(201).json(savedJob);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

  

  const getJobs = async (req, res) => {
    try {
      const jobs = await Jobs.find().sort({ createdAt: -1 });
      res.json(jobs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  };


  export { createJob, getJobs };