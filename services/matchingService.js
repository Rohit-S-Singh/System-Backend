import ResumeEmbedding from "../models/ResumeEmbedding.js";
import JobEmbedding from "../models/JobEmbedding.js";
import Job from "../models/Job.js";
import { cosineSimilarity } from "../utils/similarity.js";

export async function getRecommendedJobs(userId, limit = 20) {

  // 1️⃣ Get user's main resume embedding
  const resumeEmbedding = await ResumeEmbedding.findOne({ userId })
    .sort({ updatedAt: -1 });

  if (!resumeEmbedding) {
    throw new Error("Main resume embedding not found");
  }

  // 2️⃣ Get all job embeddings
  const jobEmbeddings = await JobEmbedding.find().lean();

  if (!jobEmbeddings.length) return [];

  // 3️⃣ Calculate similarity
  const scoredJobs = jobEmbeddings.map(job => {
    const score = cosineSimilarity(
      resumeEmbedding.embedding,
      job.embedding
    );

    return {
      jobId: job.jobId,
      score
    };
  });

  // 4️⃣ Sort by best match
  scoredJobs.sort((a, b) => b.score - a.score);

  // 5️⃣ Take top N
  const topMatches = scoredJobs.slice(0, limit);

  // 6️⃣ Fetch real job data
  const jobIds = topMatches.map(j => j.jobId);

  const jobs = await Job.find({ _id: { $in: jobIds } });

  // 7️⃣ Attach score to job
  const jobMap = new Map();
  jobs.forEach(job => jobMap.set(job._id.toString(), job));

  return topMatches.map(match => ({
    job: jobMap.get(match.jobId.toString()),
    matchScore: Number((match.score * 100).toFixed(2)) // %
  }));
}
