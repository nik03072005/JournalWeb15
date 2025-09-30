"use client";

import { useState } from 'react';
import { sendWelcomeEmailAuto } from '@/lib/emailUtils';

export default function TestWelcomeEmail() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await sendWelcomeEmailAuto(email, { firstName });
      setResult(response);
    } catch (error) {
      setResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Test Welcome Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Send a test welcome email to verify the functionality
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleTest}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="Enter first name"
            />
          </div>

          {result && (
            <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="font-medium">
                {result.success ? '✅ Success' : '❌ Error'}
              </p>
              <p className="text-sm mt-1">{result.message}</p>
              {result.messageId && (
                <p className="text-xs mt-1">Message ID: {result.messageId}</p>
              )}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !email || !firstName}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading || !email || !firstName
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#003366] hover:bg-[#002244] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400'
              } transition-all duration-200`}
            >
              {loading ? 'Sending...' : 'Send Test Welcome Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
