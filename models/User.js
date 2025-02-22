import mongoose from "../utils/mongoose.js";
import bcrypt from "bcrypt";

const schema = new mongoose.Schema({
    username: String,
    firstname: String,
    lastname: String,
    password: String,
    firstLogin: { type: Boolean, default: true }
}, {
    timestamps: true,
    collection: 'mementor.users'
})

schema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

schema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', schema);