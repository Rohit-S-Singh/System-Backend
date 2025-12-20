// controllers/jobController.js

import Job from "../../models/Job.js";

// controllers/jobSyncController.js
import axios from "axios";
import JobSyncState from "../../models/JobSyncState.js";

// utils/jobQueries.js
export const JOB_QUERIES = [
  "software engineer india",
  "frontend developer india",
  "backend developer india",
  "data analyst india",
  "sales executive india",
  "marketing executive india",
  "hr recruiter india",
  "business analyst india",
  "finance executive india",
  "internship india",
];

//auto fetch
export const syncJobsFromAPI = async () => {
  try {
    console.log("🔄 Job sync started");

    // 1️⃣ Get last used query index
    let state = await JobSyncState.findOne();
    if (!state) state = await JobSyncState.create({});

    const queryIndex = state.lastQueryIndex;
    const query = JOB_QUERIES[queryIndex];

    console.log(`📌 Fetching jobs for: ${query}`);

    // 2️⃣ Call external job API
    const response = await axios.get(
      "https://jsearch.p.rapidapi.com/search",
      {
        params: {
          query,
          page: "1",
        },
        headers: {
          "X-RapidAPI-Key": process.env.RAPID_API_KEY,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      }
    );

    const jobs = response.data.data || [];

    // 3️⃣ Store jobs in DB
    for (const job of jobs) {
      if (!job.job_id || !job.job_apply_link) continue;

      const deadline = job.job_offer_expiration_datetime
        ? new Date(job.job_offer_expiration_datetime)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await Job.updateOne(
        { externalJobId: job.job_id },
        {
          $setOnInsert: {
            title: job.job_title,
            companyName: job.employer_name,
            location: job.job_city || job.job_country,
            jobType: job.job_employment_type,
            source: "JSearch",
            applyUrl: job.job_apply_link,
            deadline,
          },
        },
        { upsert: true }
      );
    }

    // 4️⃣ Update query index for next run
    state.lastQueryIndex = (queryIndex + 1) % JOB_QUERIES.length;
    await state.save();

    console.log("✅ Job sync completed");
  } catch (error) {
    console.error("❌ Job sync failed:", error.message);
  }
};
//auto delete
export const removeExpiredJobs = async () => {
  try {
    const result = await Job.deleteMany({
      deadline: { $lt: new Date() },
    });

    if (result.deletedCount > 0) {
      console.log(`🗑️ Removed ${result.deletedCount} expired jobs`);
    }
  } catch (error) {
    console.error("❌ Failed to remove expired jobs:", error.message);
  }
};


export const getRandomJobs = async (req, res) => {
  try {
    const now = new Date();

    const jobs = await Job.aggregate([
      // 1️⃣ Only valid & active jobs
      {
        $match: {
          isActive: true,
          status: "Open",
          $or: [
            { applicationDeadline: { $gte: now } },
            { applicationDeadline: { $exists: false } }, // API jobs may not have deadline
          ],
        },
      },

      // 2️⃣ Randomize documents
      { $sample: { size: 30 } },

      // 3️⃣ Select only fields needed for frontend
      {
        $project: {
          title: 1,
          companyName: 1,
          companyLogo: 1,
          location: 1,
          jobType: 1,
          workMode: 1,
          category: 1,
          skills: 1,
          source: 1,
          applyLink: 1,
          applicationDeadline: 1,
          createdAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("❌ Error fetching random jobs:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
};


export const getJobsBySkillMatch = async (req, res) => {
  try {
    let { skills, limit = 30 } = req.body;

    // 1️⃣ Validate input
    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Skills array is required",
      });
    }

    // Normalize skills (important)
    skills = skills.map((s) => s.toLowerCase().trim());

    const now = new Date();

    // 2️⃣ MongoDB aggregation for skill matching
    const jobs = await Job.aggregate([
      // 3️⃣ Match only active & valid jobs
      {
        $match: {
          isActive: true,
          status: "Open",
          $or: [
            { applicationDeadline: { $gte: now } },
            { applicationDeadline: { $exists: false } },
          ],
          skills: { $exists: true, $ne: [] },
        },
      },

      // 4️⃣ Calculate skill match score
      {
        $addFields: {
          matchScore: {
            $size: {
              $setIntersection: ["$skills", skills],
            },
          },
        },
      },

      // 5️⃣ Remove zero-match jobs
      {
        $match: {
          matchScore: { $gt: 0 },
        },
      },

      // 6️⃣ Sort by best match
      {
        $sort: {
          matchScore: -1,
          createdAt: -1,
        },
      },

      // 7️⃣ Limit results
      {
        $limit: Number(limit),
      },

      // 8️⃣ Select required fields
      {
        $project: {
          title: 1,
          companyName: 1,
          companyLogo: 1,
          location: 1,
          jobType: 1,
          workMode: 1,
          category: 1,
          skills: 1,
          matchScore: 1,
          source: 1,
          applyLink: 1,
          applicationDeadline: 1,
          createdAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("❌ Skill match error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch matching jobs",
    });
  }
};


export const filterJobs = async (req, res) => {
  try {
    const {
      jobType,
      workMode,
      source,
      page = 1,
      limit = 30,
    } = req.query;

    const now = new Date();

    /* ===============================
       🔍 BUILD DYNAMIC FILTER OBJECT
    =============================== */

    const filterQuery = {
      isActive: true,
      status: "Open",
      $or: [
        { applicationDeadline: { $gte: now } },
        { applicationDeadline: { $exists: false } },
      ],
    };

    // 🧩 Job Type filter
    if (jobType) {
      filterQuery.jobType = jobType;
    }

    // 🧩 Work Location filter
    if (workMode) {
      filterQuery.workMode = workMode;
    }

    // 🧩 Job Source filter
    if (source) {
      filterQuery.source = source;
    }

    /* ===============================
       📦 FETCH JOBS
    =============================== */

    const jobs = await Job.find(filterQuery)
      .sort({ createdAt: -1 }) // latest jobs first
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select(
        "title companyName companyLogo location jobType workMode category skills source applyLink applicationDeadline createdAt"
      );

    /* ===============================
       📊 TOTAL COUNT (FOR PAGINATION)
    =============================== */

    const totalJobs = await Job.countDocuments(filterQuery);

    return res.status(200).json({
      success: true,
      page: Number(page),
      totalPages: Math.ceil(totalJobs / limit),
      totalJobs,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("❌ Job filter error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch filtered jobs",
    });
  }
};


export const getJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;

    // 1️⃣ Validate jobId
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required",
      });
    }

    const now = new Date();

    // 2️⃣ Fetch job
    const job = await Job.findOne({
      _id: jobId,
      isActive: true,
      status: "Open",
      $or: [
        { applicationDeadline: { $gte: now } },
        { applicationDeadline: { $exists: false } },
      ],
    })
      .populate("recruiter", "name email") // optional (for recruiter jobs)
      .lean();

    // 3️⃣ Handle not found
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or no longer active",
      });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("❌ Job details error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job details",
    });
  }
};


export const createJob = async (req, res) => {
  try {
    const user = req.user; // comes from auth middleware

    /* ===============================
       🔐 ROLE CHECK
    =============================== */
    if (!user || !["admin", "mentor", "recruiter"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to post jobs",
      });
    }

    /* ===============================
       📥 EXTRACT BODY
    =============================== */
    const {
      title,
      companyName,
      companyLogo,
      category,
      jobType,
      workMode,
      location,
      experienceLevel,
      description,
      responsibilities,
      skills,
      salary,
      applyLink,
      applicationDeadline,
    } = req.body;

    /* ===============================
       ❗ BASIC VALIDATION
    =============================== */
    if (!title || !companyName || !jobType || !workMode || !location) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    /* ===============================
       🧾 BUILD JOB OBJECT
    =============================== */
    const job = new Job({
      // 🔗 WHO POSTED
      postedBy: {
        userId: user._id,
        role: user.role,
        name: user.name,
      },

      source:
        user.role === "admin"
          ? "Admin"
          : user.role === "mentor"
          ? "Mentor"
          : "Recruiter",

      // 🏷 BASIC INFO
      title,
      companyName,
      companyLogo: companyLogo || undefined,
      category: category || undefined,
      jobType,
      workMode,
      location,
      experienceLevel: experienceLevel || undefined,

      // 📄 DETAILS
      description: description || undefined,
      responsibilities: Array.isArray(responsibilities)
        ? responsibilities
        : [],

      // 🧠 SKILLS
      skills: Array.isArray(skills)
        ? skills.map(s => s.toLowerCase())
        : [],

      // 💰 SALARY
      salary: salary || undefined,

      // 🔗 APPLY
      applyLink: applyLink || undefined,
      applicationDeadline: applicationDeadline || undefined,

      // 📊 STATUS
      status: "Open",
      isActive: true,
      isVerified: user.role === "admin", // auto-verify admin jobs
    });

    /* ===============================
       💾 SAVE JOB
    =============================== */
    const savedJob = await job.save();

    return res.status(201).json({
      success: true,
      message: "Job posted successfully",
      job: savedJob,
    });
  } catch (error) {
    console.error("Create Job Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



/* =====================================================
   🗑 DELETE JOB BY ID
===================================================== */
export const deleteJobById = async (req, res) => {
  try {
    const user = req.user;
    const { jobId } = req.params;

    /* ===============================
       🔐 AUTH CHECK
    =============================== */
    if (!user || !["admin", "mentor", "recruiter"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete jobs",
      });
    }

    /* ===============================
       🔍 FIND JOB
    =============================== */
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    /* ===============================
       🧠 OWNERSHIP CHECK
    =============================== */
    if (
      user.role !== "admin" &&
      (!job.postedBy || job.postedBy.userId.toString() !== user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "You can delete only your own job postings",
      });
    }

    /* ===============================
       🗑 DELETE JOB
    =============================== */
    await job.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete Job Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
