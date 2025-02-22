import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import auth, { namespace as authNsp } from "../socket/auth.js";
import chat, { namespace as chatNsp } from "../socket/chat.js";

// Initialisation Express et HTTP Server
export const app = express();
export const server = createServer(app);

// Configuration de Socket.io
export const io = new Server(server, {
    cors: {
        origin: "*", // Autoriser toutes les origines, ajuste selon besoin
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Gestion des connexions Socket.io
io.of(authNsp).on("connection", auth);
io.of(chatNsp).on("connection", chat);
