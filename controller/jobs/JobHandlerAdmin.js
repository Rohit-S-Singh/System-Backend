// controllers/jobController.js
import SavedJob from "../../models/SavedJob.js";

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
// export const syncJobsFromAPI = async () => {
//   try {
//     console.log("🔄 Job sync started");

//     // 1️⃣ Get last used query index
//     let state = await JobSyncState.findOne();
//     if (!state) state = await JobSyncState.create({});

//     const queryIndex = state.lastQueryIndex;
//     const query = JOB_QUERIES[queryIndex];

//     console.log(`📌 Fetching jobs for: ${query}`);

//     // 2️⃣ Call external job API
//     const response = await axios.get(   
//       "https://jsearch.p.rapidapi.com/search",
//       {
//         params: {
//           query,
//           page: "1",
//         },
//         headers: {
//           "X-RapidAPI-Key": '6548a50121mshedff1732deff2dap1e7044jsn2b6e8fa6d0ea',
//           "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
//         },
//       }
//     );

//     const jobs = response.data.data || [];
//      console.log(jobs);
        
//     // 3️⃣ Store jobs in DB
//     for (const job of jobs) {
//       if (!job.job_id || !job.job_apply_link) continue;

//       const deadline = job.job_offer_expiration_datetime
//         ? new Date(job.job_offer_expiration_datetime)
//         : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

//       await Job.updateOne(
//         { externalJobId: job.job_id },
//         {
//           $setOnInsert: {
//             title: job.job_title,
//             companyName: job.employer_name,
//             location: job.job_city || job.job_country,
//             jobType: job.job_employment_type,
//             source: "JSearch",
//             applyUrl: job.job_apply_link,
//             deadline,
//           },
//         },
//         { upsert: true }
//       );
//     }

//     // 4️⃣ Update query index for next run
//     state.lastQueryIndex = (queryIndex + 1) % JOB_QUERIES.length;
//     await state.save();

//     console.log("✅ Job sync completed");
//   } catch (error) {
//     console.error("❌ Job sync failed:", error.message);
//   }
// };

export const syncJobsFromAPI = async () => {
  try {
    console.log("🔄 Job sync started");

    let state = await JobSyncState.findOne();
    if (!state) state = await JobSyncState.create({ lastQueryIndex: 0 });

    const query = JOB_QUERIES[state.lastQueryIndex];
    console.log(`📌 Fetching jobs for: ${query}`);

    const response = await axios.get(
      "https://jsearch.p.rapidapi.com/search",
      {
        params: { query, page: "1" },
        headers: {
          "X-RapidAPI-Key": '6548a50121mshedff1732deff2dap1e7044jsn2b6e8fa6d0ea',
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      }
    );

    const jobs = response.data?.data || [];
    console.log(`📦 Jobs received: ${jobs.length}`);

    for (const job of jobs) {
      if (!job.job_id || !job.job_apply_link) continue;

      const jobType =
        job.job_employment_types?.includes("FULLTIME")
          ? "Full-Time"
          : job.job_employment_types?.includes("PARTTIME")
          ? "Part-Time"
          : job.job_employment_types?.includes("INTERN")
          ? "Internship"
          : "Contract";

      await Job.updateOne(
        { externalJobId: job.job_id },
        {
          $set: {
            title: job.job_title,
            companyName: job.employer_name,
            companyLogo: job.employer_logo || null,
            companyWebsite: job.employer_website || null,
            publisher: job.job_publisher || null,

            location: job.job_location,
            city: job.job_city || null,
            state: job.job_state || null,
            country: job.job_country || null,

            coordinates: {
              lat: job.job_latitude || null,
              lng: job.job_longitude || null,
            },

            jobType,
            workMode: job.job_is_remote ? "Remote" : "Onsite",

            description: job.job_description,

            salary: {
              min: job.job_min_salary || null,
              max: job.job_max_salary || null,
              period: job.job_salary_period || null,
            },

            benefits: Array.isArray(job.job_benefits)
              ? job.job_benefits
              : [],

            applyLink: job.job_apply_link,
            applyType: job.job_apply_is_direct
              ? "external"
              : "internal",

            postedAt: job.job_posted_at_datetime_utc
              ? new Date(job.job_posted_at_datetime_utc)
              : null,

            status: "Open",
            isActive: true,
          },
          $setOnInsert: {
            externalJobId: job.job_id,
            source: "jsearch",
          },
        },
        { upsert: true }
      );
    }

    state.lastQueryIndex =
      (state.lastQueryIndex + 1) % JOB_QUERIES.length;
    await state.save();

    console.log("✅ Job sync completed successfully");
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

// GET /api/jobs/random?limit=20
export const getRandomJobs = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;

    const jobs = await Job.aggregate([
      {
        $match: {
          isActive: true,
          status: "Open",
        },
      },
      // {
        // $sample: { size: limit },
      // },
      {
        $project: {
          _id: 1,
          title: 1,
          companyName: 1,
          companyLogo: 1,
          location: 1,
          workMode: 1,
          jobType: 1,
          createdAt: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
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



//   try {
//     const { jobId } = req.params;

//     // 1️⃣ Validate jobId
//     if (!jobId) {
//       return res.status(400).json({
//         success: false,
//         message: "Job ID is required",
//       });
//     }

//     const now = new Date();

//     // 2️⃣ Fetch job
//     const job = await Job.findOne({
//       _id: jobId,
//       isActive: true,
//       status: "Open",
//       $or: [
//         { applicationDeadline: { $gte: now } },
//         { applicationDeadline: { $exists: false } },
//       ],
//     })
//       .populate("recruiter", "name email") // optional (for recruiter jobs)
//       .lean();

//     // 3️⃣ Handle not found
//     if (!job) {
//       return res.status(404).json({
//         success: false,
//         message: "Job not found or no longer active",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       job,
//     });
//   } catch (error) {
//     console.error("❌ Job details error:", error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch job details",
//     });
//   }
// };
// GET /api/jobs/:id
export const getJobDetails = async (req, res) => {
  
  try {
  
   const { jobId } = req.params;
   console.log(jobId);
   
    const job = await Job.findById(jobId);
    console.log(job);
    
    if (!job) {
      console.log("iiiiii");
      
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    res.status(500).json({
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

/* ===============================
   SAVE A JOB
================================ */
export const saveJob = async (req, res) => {
  try {
    const { userId, jobId } = req.body;

    console.log("userId:", userId);
    console.log("jobId:", jobId);

    if (!userId || !jobId) {
      return res.status(400).json({
        message: "userId and jobId are required",
      });
    }

    // Check job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const savedJob = await SavedJob.create({
      user: userId,
      job: jobId,
    });

    res.status(201).json({
      message: "Job saved successfully",
      savedJob,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Job already saved" });
    }

    console.error(error);
    res.status(500).json({ message: "Server error" });
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



/* ===============================
   GET ALL SAVED JOBS (FULL DETAILS)
================================ */
export const getSavedJobs = async (req, res) => {
  try {
    const { userId } = req.params;

    const savedJobs = await SavedJob.find({ user: userId })
      .populate("job")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: savedJobs.length,
      savedJobs,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   REMOVE SAVED JOB
================================ */
export const removeSavedJob = async (req, res) => {
  try {
    const { userId, jobId } = req.body;

    if (!userId || !jobId) {
      return res.status(400).json({ message: "userId and jobId are required" });
    }

    await SavedJob.findOneAndDelete({
      user: userId,
      job: jobId,
    });

    res.status(200).json({ message: "Saved job removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Add job from browser extension
 * @route POST /api/jobs/ingest
 * @access Public (or token-based later)
 */
export const ingestJobFromExtension = async (req, res) => {
  try {
    const {
      externalJobId,
      source = "linkedin",
      publisher,
      title,
      companyName,
      companyLogo,
      companyWebsite,
      location,
      city,
      state,
      country,
      coordinates,
      jobType,
      workMode,
      description,
      salary,
      benefits,
      applyLink,
      postedAt,
    } = req.body;

    // 🔴 Required fields check (fail fast)
    if (!externalJobId || !title || !companyName || !applyLink || title == 'Unknown Role' || companyName == 'Unknown Company') {
      return res.status(400).json({
        success: false,
        message: "Missing required job fields",
      });
    }

    /**
     * 🔐 UPSERT LOGIC
     * - If job exists → do nothing
     * - If not → insert
     */
    const job = await Job.findOneAndUpdate(
      { externalJobId }, // 🔑 duplicate check
      {
        $setOnInsert: {
          externalJobId,
          source,
          publisher,
          title,
          companyName,
          companyLogo,
          companyWebsite,
          location,
          city,
          state,
          country,
          coordinates,
          jobType,
          workMode,
          description,
          salary,
          benefits,
          applyLink,
          postedAt,
          status: "Open",
          isActive: true,
        },
      },
      {
        upsert: true,
        new: false, // important: tells us if it already existed
      }
    );

    // If job already existed
    if (job) {
      return res.status(200).json({
        success: true,
        message: "Job already exists",
        isDuplicate: true,
      });
    }

    console.log("JOB POstewd");

    // New job inserted
    return res.status(201).json({
      success: true,
      message: "Job added successfully",
      isDuplicate: false,
    });
  } catch (error) {
    // Duplicate key safety (edge case)
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Job already exists",
        isDuplicate: true,
      });
    }

    console.error("Job ingestion error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

