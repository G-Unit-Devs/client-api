import JWT from "jsonwebtoken";
import { Messages, User } from "../models/index.js";
import MessagesBot from "../models/MessagesBot.js";

export default (socket) => {
    socket.on("join", (token) => {
        JWT.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if(err) return socket.emit("socket/error", err);
            socket.join('user/' + decoded.id);
        })
    });

    socket.on("user/get", (token, callback) => {
        JWT.verify(token, process.env.JWT_SECRET,async (err, decoded) => {
            if(err) return socket.emit("socket/error", err);
            
            const user = await User.findById(decoded.id);
            callback(user);
        })
    });

    socket.on("chats/get", (token, callback) => {
        JWT.verify(token, process.env.JWT_SECRET,async (err, decoded) => {
            if(err) return socket.emit("socket/error", err);
            
            const msgBot = await MessagesBot.findOne({ user: decoded.id });

            const msgs = await Messages.find({ users: decoded.id }).sort({ createdAt: -1 }).populate("users");
            callback({ msgs, msgBot });
        })
    });

    socket.on("msg/send/bot", (token, msg, callback) => {
        JWT.verify(token, process.env.JWT_SECRET,async (err, decoded) => {
            if(err) return socket.emit("socket/error", err);

            await MessagesBot.findOneAndUpdate({ user: decoded.id }, { $push: { messages: { text: msg, sender: "bot", date: Date.now() } } }, { new: true, upsert: true });
        });
    });

    socket.on("msg/send", (token, id, msg, callback) => {
        JWT.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if(err) return socket.emit("socket/error", err);
        
            const msgs = await Messages.findOne({ id });
            msgs.messages.push({ text: msg, sender: decoded.id, date: Date.now() });
            await msgs.save();
        });
    });
};

export const namespace = "/chat";