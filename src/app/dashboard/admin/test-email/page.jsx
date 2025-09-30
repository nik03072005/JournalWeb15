'use client';

import { useState } from 'react';
import axios from 'axios';
import { Loader2, Mail, Send } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const TestEmailPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const sendTestEmail = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await axios.post(`/api/send-mail/test-new-item-notification`);
      setResult(response.data);
      toast.success('Test emails sent successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to send test emails';
      toast.error(errorMessage);
      setResult({ error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <Toaster position="top-right" reverseOrder={false} />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-800 flex items-center gap-2">
          <Mail className="text-blue-600" />
          Test Email Notifications
        </h1>
        <p className="text-gray-600">
          Test the new item notification email system by sending sample emails to all users in the database.
        </p>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Warning:</strong> This will send test emails to all users in the database. 
              Make sure this is what you want to do, especially in production environments.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={sendTestEmail}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Sending...
            </>
          ) : (
            <>
              <Send size={20} />
              Send Test Notification Emails
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Results:</h3>
          <div className="bg-gray-50 border rounded-lg p-4">
            <pre className="text-sm overflow-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">How it works:</h4>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>The system fetches all users from the database</li>
                <li>A personalized email is sent to each user</li>
                <li>The email includes sample item details (title, type, abstract, etc.)</li>
                <li>Results show success/failure counts and any failed email addresses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEmailPage;
