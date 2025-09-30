import { Schema } from 'mongoose';
import mongoose from 'mongoose';
const subjectSchema = Schema({
    subjectName: {
        type: String,
        required: true,
        unique: true
    },
    }, { timestamps: true });
 

export default  mongoose.models.Subject || mongoose.model('Subject', subjectSchema)