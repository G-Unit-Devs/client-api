import { User } from "../models/index.js";
import JWT from "jsonwebtoken";

export default (socket) => {
    socket.on("login", async (login, password, callback) => {
        if(!login || !password) return callback({ error: "Missing login or password", status: false });

        const user = await User.findOne({ $or: [{ username: login }, { email: login }]  });
        if(!user) return callback({ error: "User not found", status: false });

        const match = await user.comparePassword(password);
        if(!match) return callback({ error: "Password incorrect", status: false });

        console.log(user);

        callback({ token: JWT.sign({ id: user._id }, process.env.JWT_SECRET), status: true, firstLogin: user.firstlogin });
    });
};

export const namespace = "/auth";