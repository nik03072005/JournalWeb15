import mongoose from 'mongoose';

// Define the FAQ schema
const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 500
  },
  answer: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 2000
  }
}, {
  timestamps: true // This automatically adds createdAt and updatedAt fields
});

// Create the model (only if it doesn't exist)
const FAQModel = mongoose.models.FAQ || mongoose.model('FAQ', faqSchema);

class FAQ {
  constructor(id = null, question = '', answer = '', createdAt = null, updatedAt = null) {
    this.id = id;
    this.question = question;
    this.answer = answer;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  // Get all FAQs
  static async getAll() {
    try {
      const faqs = await FAQModel.find({}).sort({ createdAt: -1 }).lean();
      return faqs.map(faq => new FAQ(
        faq._id.toString(), 
        faq.question, 
        faq.answer, 
        faq.createdAt, 
        faq.updatedAt
      ));
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      throw error;
    }
  }

  // Get FAQ by ID
  static async getById(id) {
    try {
      const faq = await FAQModel.findById(id).lean();
      if (!faq) return null;
      return new FAQ(faq._id.toString(), faq.question, faq.answer, faq.createdAt, faq.updatedAt);
    } catch (error) {
      console.error('Error fetching FAQ by ID:', error);
      throw error;
    }
  }

  // Create new FAQ
  static async create(question, answer) {
    try {
      if (!question || !answer) {
        throw new Error('Question and answer are required');
      }

      const newFAQ = new FAQModel({
        question: question.trim(),
        answer: answer.trim()
      });
      
      const savedFAQ = await newFAQ.save();
      return new FAQ(
        savedFAQ._id.toString(),
        savedFAQ.question,
        savedFAQ.answer,
        savedFAQ.createdAt,
        savedFAQ.updatedAt
      );
    } catch (error) {
      console.error('Error creating FAQ:', error);
      throw error;
    }
  }

  // Update FAQ
  static async update(id, question, answer) {
    try {
      if (!id || !question || !answer) {
        throw new Error('ID, question and answer are required');
      }

      const updatedFAQ = await FAQModel.findByIdAndUpdate(
        id,
        {
          question: question.trim(),
          answer: answer.trim(),
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).lean();
      
      if (!updatedFAQ) {
        throw new Error('FAQ not found');
      }
      
      return new FAQ(
        updatedFAQ._id.toString(),
        updatedFAQ.question,
        updatedFAQ.answer,
        updatedFAQ.createdAt,
        updatedFAQ.updatedAt
      );
    } catch (error) {
      console.error('Error updating FAQ:', error);
      throw error;
    }
  }

  // Delete FAQ
  static async delete(id) {
    try {
      if (!id) {
        throw new Error('FAQ ID is required');
      }

      // Get FAQ before deletion for return value
      const faq = await this.getById(id);
      if (!faq) {
        throw new Error('FAQ not found');
      }

      await FAQModel.findByIdAndDelete(id);
      return faq;
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      throw error;
    }
  }

  // Search FAQs
  static async search(searchTerm) {
    try {
      const searchRegex = new RegExp(searchTerm, 'i'); // Case-insensitive search
      const faqs = await FAQModel.find({
        $or: [
          { question: { $regex: searchRegex } },
          { answer: { $regex: searchRegex } }
        ]
      }).sort({ createdAt: -1 }).lean();
      
      return faqs.map(faq => new FAQ(
        faq._id.toString(),
        faq.question,
        faq.answer,
        faq.createdAt,
        faq.updatedAt
      ));
    } catch (error) {
      console.error('Error searching FAQs:', error);
      throw error;
    }
  }

  // Get FAQ count
  static async getCount() {
    try {
      const count = await FAQModel.countDocuments();
      return count;
    } catch (error) {
      console.error('Error getting FAQ count:', error);
      throw error;
    }
  }

  // Validate FAQ data
  static validate(question, answer) {
    const errors = [];
    
    if (!question || question.trim().length === 0) {
      errors.push('Question is required');
    } else if (question.trim().length < 5) {
      errors.push('Question must be at least 5 characters long');
    } else if (question.trim().length > 500) {
      errors.push('Question must be less than 500 characters');
    }
    
    if (!answer || answer.trim().length === 0) {
      errors.push('Answer is required');
    } else if (answer.trim().length < 10) {
      errors.push('Answer must be at least 10 characters long');
    } else if (answer.trim().length > 2000) {
      errors.push('Answer must be less than 2000 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      question: this.question,
      answer: this.answer,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default FAQ;
