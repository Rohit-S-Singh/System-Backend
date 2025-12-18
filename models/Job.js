import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    // 🔗 Recruiter who posted the job
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // 🏷 Job basic info
    title: {
      type: String,
      required: true,
      trim: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    companyLogo: {
      type: String,
    },

    jobType: {
      type: String,
      enum: ['Full-Time', 'Part-Time', 'Internship', 'Contract'],
      required: true,
    },

    workMode: {
      type: String,
      enum: ['Remote', 'Onsite', 'Hybrid'],
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    // 📄 Job description
    description: {
      type: String,
      required: true,
    },

    responsibilities: [
      {
        type: String,
      },
    ],

    skillsRequired: [
      {
        type: String,
        required: true,
      },
    ],

    // 🎓 Eligibility
    eligibility: {
      batch: [
        {
          type: Number,
        },
      ],
      minCGPA: {
        type: Number,
        min: 0,
        max: 10,
      },
      branchesAllowed: [
        {
          type: String,
        },
      ],
    },

    // 💰 Salary / Stipend
    salary: {
      min: {
        type: Number,
      },
      max: {
        type: Number,
      },
      currency: {
        type: String,
        default: 'INR',
      },
      period: {
        type: String,
        enum: ['Per Annum', 'Per Month'],
        default: 'Per Annum',
      },
    },

    // 🗓 Important dates
    applicationDeadline: {
      type: Date,
      required: true,
    },

    // 🔗 Application
    applyLink: {
      type: String,
    },

    // 📊 Job status
    status: {
      type: String,
      enum: ['Open', 'Closed', 'Paused'],
      default: 'Open',
    },

    // 👥 Applicants count
    applicantsCount: {
      type: Number,
      default: 0,
    },

    // 🔒 Admin moderation
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Job = mongoose.model('Job', jobSchema);

export default Job;
