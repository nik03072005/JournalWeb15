'use client';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  // Fetch FAQs from backend
  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/faq');
      if (!response.ok) {
        throw new Error('Failed to fetch FAQs');
      }
      const data = await response.json();
      setFaqs(data.faqs || []);
    } catch (err) {
      setError(err.message);
      // Fallback to dummy data for now
      setFaqs([
        {
          id: 1,
          question: "How do I search for academic papers?",
          answer: "You can use our search functionality to find papers by keywords, authors, or subjects. Simply enter your search terms in the search bar and browse through the results."
        },
        {
          id: 2,
          question: "Is this service free to use?",
          answer: "Yes, our basic search and browsing features are completely free. Premium features may require registration or subscription."
        },
        {
          id: 3,
          question: "How often is the database updated?",
          answer: "Our database is updated regularly with new publications from various academic sources including DOAJ and DOAB repositories."
        },
        {
          id: 4,
          question: "Can I download papers directly?",
          answer: "Download availability depends on the publisher's policies. Many open access papers can be downloaded directly, while others may redirect you to the publisher's website."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const toggleViewMore = () => {
    setShowAll(!showAll);
    if (showAll) {
      // Scroll to top of FAQ section when collapsing
      document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Determine which FAQs to display
  const displayedFaqs = showAll ? faqs : faqs.slice(0, 5);
  const hasMoreFaqs = faqs.length > 5;

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block p-3 bg-blue-100 rounded-full mb-6">
              <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/3 mx-auto"></div>
            </div>
          </div>
          <div className="max-w-5xl mx-auto space-y-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
                  <div className="h-6 bg-gray-300 rounded-lg w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error && faqs.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-block p-4 bg-red-100 rounded-full mb-6">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">⚠️</span>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-red-200 p-8">
              <p className="text-red-600 text-lg font-medium mb-4">Failed to load FAQs</p>
              <p className="text-gray-600">Please try refreshing the page or contact support if the issue persists.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="faq-section" className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">❓</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
            Find answers to common questions about our comprehensive academic journal and book library platform. 
            Can't find what you're looking for? Feel free to contact our support team.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {faqs.length > 0 ? (
            <>
              <div className="space-y-6">
                {displayedFaqs.map((faq, index) => (
                  <div
                    key={faq.id}
                    className="group bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full px-8 py-6 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent group-hover:bg-white/50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          openIndex === index 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 scale-125' 
                            : 'bg-gray-300 group-hover:bg-blue-400'
                        }`}></div>
                        <span className="font-semibold text-gray-800 pr-4 text-lg group-hover:text-blue-700 transition-colors duration-300">
                          {faq.question}
                        </span>
                      </div>
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        openIndex === index 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 rotate-180' 
                          : 'bg-gray-100 group-hover:bg-blue-100'
                      }`}>
                        {openIndex === index ? (
                          <ChevronUp className="w-5 h-5 text-white" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                        )}
                      </div>
                    </button>
                    
                    <div className={`transition-all duration-500 ease-in-out ${
                      openIndex === index 
                        ? 'max-h-96 opacity-100' 
                        : 'max-h-0 opacity-0'
                    } overflow-hidden`}>
                      <div className="px-8 pb-6">
                        <div className="pt-4 border-t border-gradient-to-r from-blue-200 to-purple-200">
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-l-4 border-blue-500">
                            <p className="text-gray-700 leading-relaxed text-base">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View More/Less Button */}
              {hasMoreFaqs && (
                <div className="text-center mt-12">
                  <button
                    onClick={toggleViewMore}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-3 mx-auto"
                  >
                    <span>{showAll ? '👆 Show Less' : '👇 View More FAQs'}</span>
                    <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                      {showAll ? 'Collapse' : `+${faqs.length - 5} more`}
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-6">
                <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">📝</span>
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">No FAQs Available</h3>
              <p className="text-gray-500 text-lg">We're working on adding helpful FAQs. Check back soon!</p>
            </div>
          )}

          {/* Contact Section */}
          {/* <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Still have questions?</h3>
              <p className="text-gray-600 mb-6">
                Our support team is here to help you with any additional questions you might have.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
                  📧 Contact Support
                </button>
                <button className="bg-white/80 hover:bg-white text-gray-700 border border-gray-200 px-8 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105">
                  📚 View Documentation
                </button>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </section>
  );
}
