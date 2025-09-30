import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    itemType: {
        type: String,
        enum: ['doaj', 'doab', 'local', 'doaj-journal', 'book', 'paper'],
        required: true
    },
    itemId: {
        type: String,
        required: true
    },
    itemTitle: {
        type: String,
        required: true
    },
    itemUrl: {
        type: String,
        required: true
    },
    action: {
        type: String,
        enum: ['view', 'download', 'bookmark'],
        default: 'view'
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    sessionDuration: {
        type: Number, // in milliseconds
        default: 0
    }
}, {
    timestamps: true
});

// Index for efficient querying
userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ itemType: 1, itemId: 1 });

const UserActivity = mongoose.models.UserActivity || mongoose.model('UserActivity', userActivitySchema);

export default UserActivity;
