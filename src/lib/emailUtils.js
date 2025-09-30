import axios from 'axios';

/**
 * Send a welcome email to a newly registered user
 * @param {string} email - User's email address
 * @param {string} firstName - User's first name
 * @param {string} loginUrl - Optional custom login URL
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendWelcomeEmail(email, firstName, loginUrl = null) {
  try {
    if (!email || !firstName) {
      return { success: false, message: 'Email and firstName are required' };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const defaultLoginUrl = `${apiUrl}/auth?tab=signin`;

    const response = await axios.post(`/api/send-mail/welcome-mail`, {
      email,
      firstName,
      loginUrl: loginUrl || defaultLoginUrl
    });

    if (response.status === 200) {
      return { 
        success: true, 
        message: 'Welcome email sent successfully',
        messageId: response.data.messageId 
      };
    } else {
      return { success: false, message: 'Failed to send welcome email' };
    }
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { 
      success: false, 
      message: error.response?.data?.error || 'Failed to send welcome email' 
    };
  }
}

/**
 * Extract first name from full name or email
 * @param {string} name - Full name or email
 * @returns {string} First name
 */
export function extractFirstName(name) {
  if (!name) return 'User';
  
  // If it's an email, extract the part before @
  if (name.includes('@')) {
    name = name.split('@')[0];
  }
  
  // Split by space and take first part
  const firstName = name.split(' ')[0];
  
  // Capitalize first letter
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}

/**
 * Send welcome email with automatic name extraction
 * @param {string} email - User's email address
 * @param {object} userData - User data object that may contain name, firstName, etc.
 * @param {string} loginUrl - Optional custom login URL
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendWelcomeEmailAuto(email, userData = {}, loginUrl = null) {
  // Try to extract first name from various possible fields
  const firstName = userData.firstName || 
                   userData.first_name || 
                   extractFirstName(userData.name) || 
                   extractFirstName(userData.fullName) || 
                   extractFirstName(email);

  return await sendWelcomeEmail(email, firstName, loginUrl);
}
