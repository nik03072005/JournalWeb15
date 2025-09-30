import FAQ from '@/models/faqModel';

class FAQController {
  // Get all FAQs
  static async getAllFAQs() {
    try {
      const faqs = await FAQ.getAll();
      return {
        success: true,
        data: faqs,
        message: 'FAQs retrieved successfully'
      };
    } catch (error) {
      console.error('Controller - Error getting all FAQs:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to retrieve FAQs',
        error: error.message
      };
    }
  }

  // Get FAQ by ID
  static async getFAQById(id) {
    try {
      if (!id) {
        return {
          success: false,
          data: null,
          message: 'FAQ ID is required'
        };
      }

      const faq = await FAQ.getById(id);
      
      if (!faq) {
        return {
          success: false,
          data: null,
          message: 'FAQ not found'
        };
      }

      return {
        success: true,
        data: faq,
        message: 'FAQ retrieved successfully'
      };
    } catch (error) {
      console.error('Controller - Error getting FAQ by ID:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to retrieve FAQ',
        error: error.message
      };
    }
  }

  // Create new FAQ
  static async createFAQ(question, answer) {
    try {
      // Validate input
      const validation = FAQ.validate(question, answer);
      if (!validation.isValid) {
        return {
          success: false,
          data: null,
          message: 'Validation failed',
          errors: validation.errors
        };
      }

      const faq = await FAQ.create(question, answer);
      
      return {
        success: true,
        data: faq,
        message: 'FAQ created successfully'
      };
    } catch (error) {
      console.error('Controller - Error creating FAQ:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to create FAQ',
        error: error.message
      };
    }
  }

  // Update FAQ
  static async updateFAQ(id, question, answer) {
    try {
      if (!id) {
        return {
          success: false,
          data: null,
          message: 'FAQ ID is required'
        };
      }

      // Validate input
      const validation = FAQ.validate(question, answer);
      if (!validation.isValid) {
        return {
          success: false,
          data: null,
          message: 'Validation failed',
          errors: validation.errors
        };
      }

      const faq = await FAQ.update(id, question, answer);
      
      return {
        success: true,
        data: faq,
        message: 'FAQ updated successfully'
      };
    } catch (error) {
      console.error('Controller - Error updating FAQ:', error);
      
      if (error.message === 'FAQ not found') {
        return {
          success: false,
          data: null,
          message: 'FAQ not found'
        };
      }

      return {
        success: false,
        data: null,
        message: 'Failed to update FAQ',
        error: error.message
      };
    }
  }

  // Delete FAQ
  static async deleteFAQ(id) {
    try {
      if (!id) {
        return {
          success: false,
          data: null,
          message: 'FAQ ID is required'
        };
      }

      const deletedFaq = await FAQ.delete(id);
      
      return {
        success: true,
        data: deletedFaq,
        message: 'FAQ deleted successfully'
      };
    } catch (error) {
      console.error('Controller - Error deleting FAQ:', error);
      
      if (error.message === 'FAQ not found') {
        return {
          success: false,
          data: null,
          message: 'FAQ not found'
        };
      }

      return {
        success: false,
        data: null,
        message: 'Failed to delete FAQ',
        error: error.message
      };
    }
  }

  // Search FAQs
  static async searchFAQs(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return {
          success: false,
          data: null,
          message: 'Search term is required'
        };
      }

      const faqs = await FAQ.search(searchTerm.trim());
      
      return {
        success: true,
        data: faqs,
        message: `Found ${faqs.length} FAQ(s) matching your search`
      };
    } catch (error) {
      console.error('Controller - Error searching FAQs:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to search FAQs',
        error: error.message
      };
    }
  }

  // Get FAQ statistics
  static async getFAQStats() {
    try {
      const totalCount = await FAQ.getCount();
      const allFaqs = await FAQ.getAll();
      
      // Calculate some basic stats
      const recentFaqs = allFaqs.filter(faq => {
        const faqDate = new Date(faq.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return faqDate > weekAgo;
      }).length;

      const avgQuestionLength = allFaqs.length > 0 
        ? Math.round(allFaqs.reduce((sum, faq) => sum + faq.question.length, 0) / allFaqs.length)
        : 0;

      const avgAnswerLength = allFaqs.length > 0
        ? Math.round(allFaqs.reduce((sum, faq) => sum + faq.answer.length, 0) / allFaqs.length)
        : 0;

      return {
        success: true,
        data: {
          totalFaqs: totalCount,
          recentFaqs: recentFaqs,
          averageQuestionLength: avgQuestionLength,
          averageAnswerLength: avgAnswerLength
        },
        message: 'FAQ statistics retrieved successfully'
      };
    } catch (error) {
      console.error('Controller - Error getting FAQ stats:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to retrieve FAQ statistics',
        error: error.message
      };
    }
  }

  // Bulk create FAQs (for seeding or importing)
  static async bulkCreateFAQs(faqsData) {
    try {
      if (!Array.isArray(faqsData) || faqsData.length === 0) {
        return {
          success: false,
          data: null,
          message: 'Invalid FAQ data provided'
        };
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < faqsData.length; i++) {
        const { question, answer } = faqsData[i];
        
        try {
          const validation = FAQ.validate(question, answer);
          if (!validation.isValid) {
            errors.push({
              index: i,
              question: question,
              errors: validation.errors
            });
            continue;
          }

          const faq = await FAQ.create(question, answer);
          results.push(faq);
        } catch (error) {
          errors.push({
            index: i,
            question: question,
            error: error.message
          });
        }
      }

      return {
        success: true,
        data: {
          created: results,
          errors: errors,
          successCount: results.length,
          errorCount: errors.length
        },
        message: `Successfully created ${results.length} FAQs. ${errors.length} errors occurred.`
      };
    } catch (error) {
      console.error('Controller - Error bulk creating FAQs:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to bulk create FAQs',
        error: error.message
      };
    }
  }
}

export default FAQController;
