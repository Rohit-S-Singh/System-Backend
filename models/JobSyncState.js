// models/JobSyncState.js
import mongoose from "mongoose";

const jobSyncStateSchema = new mongoose.Schema({
  lastQueryIndex: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("JobSyncState", jobSyncStateSchema);
