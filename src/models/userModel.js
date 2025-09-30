import { Schema, model } from 'mongoose';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


const userSchema = new Schema({
    firstname: {
        type: String,
        required: true,
       
        trim: true
    },
    lastname: {
        type: String,
        required: true,
       
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    mobileNumber:{
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    // subscription: {
       
    //     status:{
    //         type:String,
    //         enum: {
    //             values: ["active", "inactive", "suspended"],
    //             message: '{VALUE} is not a valid subscription status. Valid statuses are: active, inactive, suspended'
    //         },
    //         default: "active"
    //     },
    //     startDate:{
    //         type: Date,
    //         default: Date.now
    //     },
    //     //endDate will be after one year of start date
    //     endDate:{
    //         type: Date,
    //         default: () => {
    //             const start = new Date();
    //             start.setFullYear(start.getFullYear() + 1);
    //             return start;
    //         }
    //     }

    // },
    role: {
        type: String,
        enum: {
            values: ["admin", "teachingStaff", "student", "nonTeachingStaff"],
            message: '{VALUE} is not a valid role. Valid roles are: admin, teachingStaff, student, nonTeachingStaff'
        },
        required: [true, 'Role is required']
    }
    }, { timestamps: true });

    // Hash password before saving
userSchema.pre('save', async function(next) {
    try {
        if (this.isModified('password')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
        next();
    } catch (err) {
        next(err);
    }
});

// Add password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema)