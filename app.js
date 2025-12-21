import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import router from './routes/Route.js';
import cors from "cors";
import dotenv from 'dotenv';
import { createServer } from "http";
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
    .then(() => console.log("Database connected successfully"))
    .catch((err) => console.error("Database connection error:", err.message));


app.use('/api', router);


httpServer.listen(port, () => {
    console.log(`Access locally at http://localhost:${port}`);
});
