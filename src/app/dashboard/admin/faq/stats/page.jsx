'use client';
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, FileText, Calendar, RefreshCw } from 'lucide-react';

export default function FAQStatsPage() {
  const [stats, setStats] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchFAQs();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/faq/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/faq');
      const data = await response.json();
      if (data.success) {
        setFaqs(data.faqs);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    setLoading(true);
    fetchStats();
    fetchFAQs();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentFAQs = faqs
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const longestQuestions = faqs
    .sort((a, b) => b.question.length - a.question.length)
    .slice(0, 3);

  const longestAnswers = faqs
    .sort((a, b) => b.answer.length - a.answer.length)
    .slice(0, 3);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">FAQ Statistics</h1>
          <p className="text-gray-600">Insights and analytics for your FAQ system</p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total FAQs</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalFaqs}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Added This Week</p>
                <p className="text-3xl font-bold text-green-600">{stats.recentFaqs}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Question Length</p>
                <p className="text-3xl font-bold text-purple-600">{stats.averageQuestionLength}</p>
                <p className="text-xs text-gray-500">characters</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Answer Length</p>
                <p className="text-3xl font-bold text-orange-600">{stats.averageAnswerLength}</p>
                <p className="text-xs text-gray-500">characters</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Recent FAQs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Recent FAQs
          </h2>
          <div className="space-y-4">
            {recentFAQs.map((faq) => (
              <div key={faq.id} className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-800 text-sm">{faq.question}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Added: {new Date(faq.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            {recentFAQs.length === 0 && (
              <p className="text-gray-500 text-center py-4">No FAQs available</p>
            )}
          </div>
        </div>

        {/* Content Analysis */}
        <div className="space-y-6">
          {/* Longest Questions */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Longest Questions
            </h2>
            <div className="space-y-3">
              {longestQuestions.map((faq, index) => (
                <div key={faq.id} className="flex items-start gap-3">
                  <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 line-clamp-2">{faq.question}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {faq.question.length} characters
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Longest Answers */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Longest Answers
            </h2>
            <div className="space-y-3">
              {longestAnswers.map((faq, index) => (
                <div key={faq.id} className="flex items-start gap-3">
                  <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium line-clamp-1">{faq.question}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Answer: {faq.answer.length} characters
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
