import FAQController from '@/controllers/faqController';

const initialFAQs = [
  {
    question: "How do I search for academic papers?",
    answer: "You can use our search functionality to find papers by keywords, authors, or subjects. Simply enter your search terms in the search bar and browse through the results. You can also use the subject dropdown to browse papers by specific academic disciplines."
  },
  {
    question: "Is this service free to use?",
    answer: "Yes, our basic search and browsing features are completely free. You can search through our extensive database of academic papers and journals without any cost. Premium features may require registration or subscription."
  },
  {
    question: "How often is the database updated?",
    answer: "Our database is updated regularly with new publications from various academic sources including DOAJ (Directory of Open Access Journals) and DOAB (Directory of Open Access Books) repositories. New papers are typically added within 24-48 hours of publication."
  },
  {
    question: "Can I download papers directly?",
    answer: "Download availability depends on the publisher's policies and the paper's access type. Many open access papers can be downloaded directly from our platform, while others may redirect you to the publisher's website. We clearly indicate the access type for each paper."
  },
  {
    question: "How do I register for an account?",
    answer: "Click on the 'Login' button in the top navigation and then select 'Register' to create a new account. Registration allows you to save your favorite papers, create collections, and access additional features."
  },
  {
    question: "What subjects are covered in your database?",
    answer: "Our database covers a wide range of academic subjects including Computer Science, Engineering, Medicine, Physics, Chemistry, Biology, Mathematics, Psychology, Economics, Environmental Science, Materials Science, Biotechnology, Artificial Intelligence, Data Science, and Renewable Energy."
  },
  {
    question: "How can I save papers for later reading?",
    answer: "Once you're logged in, you can save papers to your personal collection by clicking the bookmark icon on any paper. You can then access your saved papers from your dashboard."
  },
  {
    question: "Do you support advanced search filters?",
    answer: "Yes, our advanced search allows you to filter results by publication date, subject area, document type, language, and author. You can access advanced search from the 'Browse' section."
  },
  {
    question: "How do I report incorrect or missing information?",
    answer: "If you notice any incorrect or missing information, please contact our support team through the contact form. We appreciate user feedback and work quickly to correct any issues in our database."
  },
  {
    question: "Can I access the service on mobile devices?",
    answer: "Yes, our platform is fully responsive and works seamlessly on all devices including smartphones and tablets. You can search, browse, and read papers on any device with an internet connection."
  }
];

class FAQSeeder {
  static async seed() {
    try {
      console.log('Starting FAQ seeding...');
      
      // Check if FAQs already exist
      const existingFAQs = await FAQController.getAllFAQs();
      
      if (existingFAQs.success && existingFAQs.data.length > 0) {
        console.log(`Found ${existingFAQs.data.length} existing FAQs. Skipping seeding.`);
        return {
          success: true,
          message: 'FAQs already exist, seeding skipped',
          data: existingFAQs.data
        };
      }
      
      // Bulk create initial FAQs
      const result = await FAQController.bulkCreateFAQs(initialFAQs);
      
      if (result.success) {
        console.log(`Successfully seeded ${result.data.successCount} FAQs`);
        if (result.data.errorCount > 0) {
          console.log(`${result.data.errorCount} errors occurred during seeding:`, result.data.errors);
        }
        
        return {
          success: true,
          message: `Successfully seeded ${result.data.successCount} FAQs`,
          data: result.data
        };
      } else {
        console.error('Failed to seed FAQs:', result.message);
        return result;
      }
      
    } catch (error) {
      console.error('Error during FAQ seeding:', error);
      return {
        success: false,
        message: 'Failed to seed FAQs',
        error: error.message
      };
    }
  }
  
  static async reset() {
    try {
      console.log('Resetting FAQ database...');
      
      // Get all existing FAQs
      const existingFAQs = await FAQController.getAllFAQs();
      
      if (existingFAQs.success && existingFAQs.data.length > 0) {
        // Delete all existing FAQs
        for (const faq of existingFAQs.data) {
          await FAQController.deleteFAQ(faq.id);
        }
        console.log(`Deleted ${existingFAQs.data.length} existing FAQs`);
      }
      
      // Seed new FAQs
      const seedResult = await this.seed();
      
      return {
        success: true,
        message: 'FAQ database reset and seeded successfully',
        data: seedResult.data
      };
      
    } catch (error) {
      console.error('Error during FAQ reset:', error);
      return {
        success: false,
        message: 'Failed to reset FAQ database',
        error: error.message
      };
    }
  }
}

export default FAQSeeder;
