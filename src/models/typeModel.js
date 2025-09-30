import { Schema } from 'mongoose';
import mongoose from 'mongoose';
const typeSchema = Schema({
    typeName: {
        type: String,
        required: true,
        unique: true
    },
    }, { timestamps: true });
 
export default mongoose.models.Type || mongoose.model('Type', typeSchema);