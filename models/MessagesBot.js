import mongoose from "../utils/mongoose.js";

export default mongoose.model('MessagesBot', new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    messages: [{ text: String, sender: { type: String, enum: ["bot", "user"], required: true }, date: Number }]
}, {
    timestamps: true,
    collection: 'mementor.messages-bot'
}));