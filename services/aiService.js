import axios from "axios";

const AI_BASE_URL = "http://localhost:8001";

export const processResumeWithAI = async ({ filePath, resumeId, userId }) => {
  try {
    const response = await axios.post(
      `${AI_BASE_URL}/process-resume`,
      {
        file_path: filePath,
        resume_id: resumeId,
        user_id: userId
      },
      { timeout: 120000 }
    );

    return response.data;

  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || "AI service error");
    } else if (error.request) {
      throw new Error("AI service not reachable");
    } else {
      throw new Error(error.message);
    }
  }
};
export const processJobWithAI = async ({ jobId, title, company, description }) => {
  try {
    const response = await axios.post(
      `${AI_BASE_URL}/process-job`,
      {
        job_id: jobId,
        title,
        company,
        description
      },
      { timeout: 120000 }
    );

    return response.data;

  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || "AI job processing error");
    } else if (error.request) {
      throw new Error("AI service not reachable");
    } else {
      throw new Error(error.message);
    }
  }
};
