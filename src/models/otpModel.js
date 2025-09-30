import { Schema, model } from 'mongoose';
import mongoose from 'mongoose';

const otpSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0,
        max: 3 // Maximum 3 verification attempts
    }
}, {
    timestamps: true
});

// Index for automatic deletion of expired documents (5 minutes = 300 seconds)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 300 });

// Index for faster email lookups
otpSchema.index({ email: 1, isUsed: 1 });

// Static method to clean up old OTPs for an email
otpSchema.statics.cleanupOldOTPs = async function(email) {
    await this.deleteMany({ 
        email: email, 
        $or: [
            { isUsed: true },
            { expiresAt: { $lt: new Date() } }
        ]
    });
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(email, otp) {
    const otpRecord = await this.findOne({
        email: email,
        otp: otp,
        isUsed: false,
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        return { success: false, message: 'Invalid or expired OTP' };
    }

    if (otpRecord.attempts >= 3) {
        return { success: false, message: 'Maximum verification attempts exceeded' };
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    return { success: true, message: 'OTP verified successfully' };
};

const OTP = mongoose.models.OTP || model('OTP', otpSchema);

export default OTP;
