import { Schema, model } from 'mongoose';
import mongoose from 'mongoose';

const visitorSchema = new Schema({
    paperId: {
        type: String,
        required: true,
        index: true
    },
    paperType: {
        type: String,
        enum: ['local', 'doaj', 'doaj-journal', 'doab'],
        default: 'local'
    },
    visitCount: {
        type: Number,
        default: 0
    },
    lastVisited: {
        type: Date,
        default: Date.now
    },
    // Track unique visitors using IP or session
    uniqueVisitors: [{
        identifier: String, // Could be IP address or session ID
        firstVisit: {
            type: Date,
            default: Date.now
        },
        lastVisit: {
            type: Date,
            default: Date.now
        },
        visitCount: {
            type: Number,
            default: 1
        }
    }]
}, { timestamps: true });

// Create compound index for efficient queries
visitorSchema.index({ paperId: 1, paperType: 1 }, { unique: true });

export default mongoose.models.Visitor || mongoose.model('Visitor', visitorSchema);
