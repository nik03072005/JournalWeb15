'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Search, BarChart3, RefreshCw } from 'lucide-react';

export default function AdminFAQ() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ question: '', answer: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    fetchFAQs();
    fetchStats();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
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

  const searchFAQs = async () => {
    if (!searchTerm.trim()) {
      fetchFAQs();
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/faq/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      if (data.success) {
        setFaqs(data.faqs);
      } else {
        alert('Error searching FAQs: ' + data.message);
      }
    } catch (error) {
      console.error('Error searching FAQs:', error);
      alert('Error searching FAQs');
    } finally {
      setLoading(false);
    }
  };

  const seedDatabase = async (reset = false) => {
    try {
      const action = reset ? 'reset' : 'seed';
      const response = await fetch('/api/faq/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchFAQs();
        fetchStats();
      } else {
        alert('Error seeding database: ' + data.message);
      }
    } catch (error) {
      console.error('Error seeding database:', error);
      alert('Error seeding database');
    }
  };

  const handleAdd = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      alert('Please fill in both question and answer');
      return;
    }

    try {
      const response = await fetch('/api/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setFaqs([...faqs, data.faq]);
        setFormData({ question: '', answer: '' });
        setShowAddForm(false);
        alert('FAQ added successfully!');
      } else {
        alert('Error adding FAQ: ' + data.message);
      }
    } catch (error) {
      console.error('Error adding FAQ:', error);
      alert('Error adding FAQ');
    }
  };

  const handleEdit = async (id, updatedData) => {
    try {
      const response = await fetch('/api/faq', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updatedData })
      });

      const data = await response.json();
      if (data.success) {
        setFaqs(faqs.map(faq => faq.id === id ? data.faq : faq));
        setEditingId(null);
        alert('FAQ updated successfully!');
      } else {
        alert('Error updating FAQ: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating FAQ:', error);
      alert('Error updating FAQ');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const response = await fetch(`/api/faq?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setFaqs(faqs.filter(faq => faq.id !== id));
        alert('FAQ deleted successfully!');
      } else {
        alert('Error deleting FAQ: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      alert('Error deleting FAQ');
    }
  };

  const EditForm = ({ faq, onSave, onCancel }) => {
    const [editData, setEditData] = useState({
      question: faq.question,
      answer: faq.answer
    });

    return (
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
          <input
            type="text"
            value={editData.question}
            onChange={(e) => setEditData({ ...editData, question: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Answer</label>
          <textarea
            value={editData.answer}
            onChange={(e) => setEditData({ ...editData, answer: e.target.value })}
            rows="4"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(editData)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Save size={16} />
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <X size={16} />
            Cancel
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50">
      <div className="h-screen overflow-y-auto">
        <div className="p-6">
          <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">FAQ Management</h1>
        <p className="text-gray-600">Manage frequently asked questions for your website</p>
      </div>

      {/* Stats Card */}
      {stats && (
        <div className="mb-6 bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Statistics</h2>
            <button
              onClick={() => setShowStats(!showStats)}
              className="text-blue-600 hover:text-blue-700"
            >
              <BarChart3 size={20} />
            </button>
          </div>
          
          {showStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalFaqs}</div>
                <div className="text-sm text-gray-600">Total FAQs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.recentFaqs}</div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.averageQuestionLength}</div>
                <div className="text-sm text-gray-600">Avg Question Length</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.averageAnswerLength}</div>
                <div className="text-sm text-gray-600">Avg Answer Length</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={16} />
            Add New FAQ
          </button>
          <button
            onClick={() => seedDatabase(false)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <RefreshCw size={16} />
            Seed Database
          </button>
          <button
            onClick={() => seedDatabase(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <RefreshCw size={16} />
            Reset & Seed
          </button>
        </div>
        
        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && searchFAQs()}
          />
          <button
            onClick={searchFAQs}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <Search size={16} />
            Search
          </button>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                fetchFAQs();
              }}
              className="px-3 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Add FAQ Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Add New FAQ</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the question"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Answer</label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              rows="4"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the answer"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Save size={16} />
              Add FAQ
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setFormData({ question: '', answer: '' });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* FAQ List */}
      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id} className="bg-white border border-gray-200 rounded-lg p-6">
            {editingId === faq.id ? (
              <EditForm
                faq={faq}
                onSave={(updatedData) => handleEdit(faq.id, updatedData)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{faq.question}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(faq.id)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-md"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                <div className="mt-4 text-sm text-gray-400">
                  Created: {new Date(faq.createdAt).toLocaleDateString()}
                  {faq.updatedAt !== faq.createdAt && (
                    <span className="ml-4">
                      Updated: {new Date(faq.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {faqs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No FAQs available. Add your first FAQ to get started!</p>
        </div>
      )}
    </div>
    </div>
    </div>
  );
}
