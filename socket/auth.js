import { User } from "../models/index.js";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";;
import Trajectory from "../models/Trajectory.js";

export default (socket) => {
    socket.on("login", async (login, password, callback) => {
        if(!login || !password) return callback({ error: "Missing login or password", status: false });

        const user = await User.findOne({ $or: [{ username: login }, { email: login }]  });
        if(!user) return callback({ error: "User not found", status: false });

        const match = await user.comparePassword(password);
        if(!match) return callback({ error: "Password incorrect", status: false });

        callback({ token: JWT.sign({ id: user._id }, process.env.JWT_SECRET), status: true, firstLogin: user.firstlogin });
    });

    socket.on("signup", async (data, callback) => {
        try {
            const { username, firstname, lastname, email, password, language = "fr", role = 2 } = data;

            if (!username || !firstname || !lastname || !email || !password) {
                return callback({ error: "Missing required fields", status: false });
            }

            // Vérifier si l'utilisateur existe déjà
            const existingUser = await User.findOne({ $or: [{ username }, { email }] });
            if (existingUser) return callback({ error: "User already exists", status: false });

            // Créer un nouvel utilisateur
            const newUser = await new User({
                username,
                firstname,
                lastname,
                email,
                password,
                language,
                role
            }).save();

            // Créer une entrée de trajectoire pour l'utilisateur
            await new Trajectory({ user: newUser._id, trajectory: {} }).save();

            // Générer un token JWT
            const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);

            callback({ token, status: true, firstLogin: true });

        } catch (error) {
            console.error(error);
            callback({ error: "Internal server error", status: false });
        }
    });
};

export const namespace = "/auth";