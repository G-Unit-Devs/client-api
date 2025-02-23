import mongoose from "../utils/mongoose.js";

export default mongoose.model('Trajectory', new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    trajectory: { type: Object, default: {} }
}, {
    timestamps: true,
    collection: 'mementor.trajectories'
}));