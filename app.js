import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import router from './routes/Route.js';
import cors from "cors";
import dotenv from 'dotenv';
import { createServer } from "http";
import { startJobCron } from "./controller/jobs/jobCron.js";
import { trackVisitor } from "./middleware/trackVisitor.js";
import { Server } from "socket.io";
import User from "./models/User.js";

import '@shopify/shopify-api/adapters/node';

import {shopifyApi, LATEST_API_VERSION} from '@shopify/shopify-api';
import { Session } from "inspector";

dotenv.config();
const app = express();
const port = 8080;
const connectionUrl = "mongodb://rohitssingh17:Seeyouagain11!@ac-lo7eev6-shard-00-00.xo7hitn.mongodb.net:27017,ac-lo7eev6-shard-00-01.xo7hitn.mongodb.net:27017,ac-lo7eev6-shard-00-02.xo7hitn.mongodb.net:27017/?ssl=true&replicaSet=atlas-4oinm6-shard-0&authSource=admin&retryWrites=true&w=majority";



app.use(cors());
// app.use(cors({
//   origin: "http://localhost:3000",
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true
// }));

const httpServer = createServer(app);

app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

mongoose.connect(connectionUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {console.log("Database connected successfully")

         //  startJobCron()
             })

    .catch((err) => console.error("Database connection error:", err.message));

app.use(trackVisitor);
// app.post("/create-interview", async (req, res) => {
//     try {
//       const { interviewType } = req.body;
  
//       const response = await fetch(
//         "https://api.vapi.ai/call/web/token",
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             assistantId: process.env.VAPI_ASSISTANT_ID,
//             metadata: {
//               interviewType,
//               candidateId: "local-test-user",
//             },
//           }),
//         }
//       );
  
//       const data = await response.json();
  
//       console.log("VAPI TOKEN RESPONSE:", data);
  
//       res.json({
//         token: data.token, // ✅ THIS is what frontend needs
//       });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: "Failed to create interview" });
//     }
//   });
  
  
app.post("/create-interview", async (req, res) => {
    try {
      const { interviewType } = req.body;
  
      if (!interviewType) {
        return res.status(400).json({ error: "interviewType required" });
      }
  
      res.json({
        assistantId: process.env.VAPI_ASSISTANT_ID,
        metadata: {
          interviewType,
          candidateId: "local-test-user",
          source: "realhired-web",
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create interview" });
    }
  });
  
app.use('/api', router);


httpServer.listen(port,'0.0.0.0', () => {
    console.log(`Access locally at http://localhost:${port}`);
});
