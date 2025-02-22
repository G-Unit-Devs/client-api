import mongoose from "../utils/mongoose.js";

export default mongoose.model('Messages', new mongoose.Schema({
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [{ text: String, sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, date: Number }]
}, {
    timestamps: true,
    collection: 'mementor.messages'
}));