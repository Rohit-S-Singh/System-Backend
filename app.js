import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import OurRouter from './routes/Route.js';
import cors from "cors";
import dotenv from 'dotenv';
import { createServer } from "http";
import { Server } from "socket.io";
import User from "./models/User.js";

dotenv.config();
const app = express();
const port = 8000;
const connectionUrl = "mongodb://rohitssingh17:Seeyouagain11!@ac-lo7eev6-shard-00-00.xo7hitn.mongodb.net:27017,ac-lo7eev6-shard-00-01.xo7hitn.mongodb.net:27017,ac-lo7eev6-shard-00-02.xo7hitn.mongodb.net:27017/?ssl=true&replicaSet=atlas-4oinm6-shard-0&authSource=admin&retryWrites=true&w=majority";



const httpServer = createServer(app);

export const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});

app.use(cors());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

mongoose.connect(connectionUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Database connected successfully"))
    .catch((err) => console.error("Database connection error:", err.message));



io.on("connection", (socket) => {
    let userId;
    
    socket.on('userOnline', async (payload) => {
        userId = payload;
        if (!userId) return console.log("No user Id");
        const user = await User.findById(userId);
        user.online = true;
        await user.save();
        io.emit('userOnline', { userId });
    });

    socket.on('disconnect', async () => {
        if (!userId) return console.log("No user Id");
        const user = await User.findById(userId);
        user.online = false;
        await user.save();
        io.emit('userOffline', { userId });
    });

    socket.on('sendMsg', (payload) => {
        io.emit('sendMsg', payload);
    });

    socket.on('userIsTyping', (payload) => {
        const { senderId, receiverId } = payload;
        io.emit('userIsTyping', { senderId, receiverId });
    });

    socket.on('userStopTyping', (payload) => {
        const { senderId, receiverId } = payload;
        io.emit('userStopTyping', { senderId, receiverId });
    });
});

app.use('/api/', OurRouter);

httpServer.listen(port, '0.0.0.0', () => {
    console.log(`App is running at http://0.0.0.0:${port}`);
    console.log(`Access locally at http://localhost:${port}`);
});
