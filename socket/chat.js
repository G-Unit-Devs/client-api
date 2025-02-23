import JWT from "jsonwebtoken";
import { Messages, Trajectory, User } from "../models/index.js";
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
            const { messages: messagesBot } = await MessagesBot.findOne({ user: decoded.id });
            if (user.firstLogin && messagesBot.length === 0) {
                socket.emit('loading/chat/bot',true);
                socket.emit('loading/chat/bot/box',true);
                fetch("https://5968-37-165-149-83.ngrok-free.app/greetings").then(res => res.json()).then(async res => {
                    await MessagesBot.findOneAndUpdate({ user: decoded.id }, { $push: { messages: { text: res.message, sender: "bot", date: Date.now() } } }, { new: true, upsert: true })
                    socket.emit('loading/chat/bot',false);
                    socket.emit('loading/chat/bot/box',false);
                });
            }

            if (messagesBot.length > 0 && messagesBot[messagesBot.length - 1].sender === "user") {
                socket.emit('loading/chat/bot',true);
                const role = ["admin", "pro", "chercheur"][user.role];

                fetch("https://5968-37-165-149-83.ngrok-free.app/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", },
                    body: JSON.stringify({
                        role,
                        message: messagesBot[messagesBot.length - 1].text,
                        trajectory: {...(await Trajectory.findOne({ user: decoded.id }))?.trajectory ?? {}, role},
                        history: (await MessagesBot.findOne({ user: decoded.id })).messages.filter(msg => msg.sender === "user").map(msg => ({ role, content: msg.text }))
                    }),
                }).then(res => res.json()).then(async res => {
                    if(res.response) await MessagesBot.findOneAndUpdate({ user: decoded.id }, { $push: { messages: { text: res.response, sender: "bot", date: Date.now() } } }, { new: true, upsert: true });
                    if (res.trajectory) await Trajectory.findOneAndUpdate({ user: decoded.id }, { $set: { trajectory: res.trajectory } }, { new: true, upsert: true });
                    if (res.language) await User.findOneAndUpdate({ _id: decoded.id }, { $set: { language: res.language } });
                    socket.emit('loading/chat/bot',false);
                });
            }
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
        try {
            JWT.verify(token, process.env.JWT_SECRET,async (err, decoded) => {
                if(err) return socket.emit("socket/error", err);

                await MessagesBot.findOneAndUpdate({ user: decoded.id }, { $push: { messages: { text: msg, sender: "user", date: Date.now() } } }, { new: true, upsert: true });

                const user = await User.findById(decoded.id);
                const role = ["admin", "pro", "chercheur"][user.role];
                socket.emit('loading/chat/bot',true);
                const trajectory = (await Trajectory.findOne({ user: decoded.id }))?.trajectory;

                fetch("https://5968-37-165-149-83.ngrok-free.app/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", },
                    body: JSON.stringify({
                        role,
                        message: msg,
                        trajectory: {...trajectory ?? {}, role},
                        history: (await MessagesBot.findOne({ user: decoded.id })).messages.filter(msg => msg.sender === "user").map(msg => ({ role, content: msg.text }))
                    }),
                }).then(res => res.json()).then(async res => {
                    const new_trajectory = {...trajectory, ...res.trajectory};

                    if(res.response) await MessagesBot.findOneAndUpdate({ user: decoded.id }, { $push: { messages: { text: res.response, sender: "bot", date: Date.now() } } }, { new: true, upsert: true });
                    if (res.trajectory) await Trajectory.findOneAndUpdate({ user: decoded.id }, { $set: { trajectory: new_trajectory } }, { new: true, upsert: true });
                    if (res.language) await User.findOneAndUpdate({ _id: decoded.id }, { $set: { language: res.language } });

                    const ready = [new_trajectory?.about, new_trajectory?.centres_interets, new_trajectory?.expectations, (new_trajectory.stories || new_trajectory?.histoires)].every(e => e !== undefined);

                    if(!ready) return;

                    await User.findByIdAndUpdate(decoded.id, { $set: { firstLogin: false } });

                    const dataset = await Promise.all(
                        (await User.find().select("role language data")).map(async user => ({
                            ...user._doc,
                            role: ["admin", "pro", "chercheur"][user.role],
                            data: await Trajectory.findOne({ user: user._id })
                        }))
                    );
                    
                    const response = {
                        user_data: { role, language: "fr", data: new_trajectory },
                        dataset
                    };

                    fetch("https://2b5b-77-136-67-249.ngrok-free.app/recommend/", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", },
                        body: JSON.stringify(response),
                    }).then(res => res.json());
                    socket.emit('loading/chat/bot',false);
                });
            });
        } catch (error) {
            
        }
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