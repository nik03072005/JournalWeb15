import { Schema } from 'mongoose';
import mongoose from 'mongoose';

const journalSchema = new Schema({
  type: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  detail: {
    type: Schema.Types.ObjectId,
    ref: 'Detail',
    required: true
  },
  subject: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  }
}, { timestamps: true });

export default mongoose.models.Journal || mongoose.model('Journal', journalSchema);
