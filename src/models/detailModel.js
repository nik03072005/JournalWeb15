import { Schema } from 'mongoose';
import mongoose from 'mongoose';

const creatorSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String },
});

const guideSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String },
});

const detailSchema = Schema({
  title: {
    type: String,
    required: true,
   
  },
  abstract: {
    type: String
  },
  creators: {
    type: [creatorSchema],
    required: true,
    validate: v => Array.isArray(v) && v.length > 0
  },
  guides: {
    type: [guideSchema],
    
    validate: v => Array.isArray(v) && v.length > 0
  },
  status: {
    type: String,
    enum: ['In Press', 'Submitted', 'Pending'],
    default: 'In Press'
  },
  volume: {
    type: Number
  },
  number: {
    type: Number
  },
  pageRange: {
    type: String
  },
  date: {
    type: Date
  },
  references: {
    type: String
  },
  keywords: {
    type: String
  },
  journalOrPublicationTitle: {
    type: String
  },
  issn: {
    type: String
  },
  officialURL: {
    type: String
  },
  doi: {
    type: String
  },
  conference: {
    type: String
  },
  bookName: {
    type: String
  },
  isbn: {
    type: String
  },
  publisher: {
    type: String
  },
  preface: {
    type: String
  },
  department: {
    type: String
  },
  university: {
    type: String
  },
  courseName: {
    type: String
  },
  courseCode: {
    type: String
  },
  semester: {
    type: String
  },
  year: {
    type: String
  }
}, { timestamps: true });

// In dev/Next.js hot-reload, ensure updated schema is applied
if (mongoose.models.Detail) {
  try {
    // Prefer connection-scoped delete when available
    mongoose.connection.deleteModel?.('Detail');
  } catch (e) {
    // Fallback: clear from models cache
    delete mongoose.models.Detail;
  }
}

export default mongoose.models.Detail || mongoose.model('Detail', detailSchema);