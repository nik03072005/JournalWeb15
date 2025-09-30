import { Schema } from 'mongoose';
import mongoose from 'mongoose';

const departmentSchema = Schema({
  departmentName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
}, { timestamps: true });

export default mongoose.models.Department || mongoose.model('Department', departmentSchema);
