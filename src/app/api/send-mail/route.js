import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { generateAndStoreOTP } from '@/lib/otpUtils';

// Helper function to extract and format first name
function extractFirstName(email, providedName = null) {
  if (providedName && providedName.trim()) {
    return providedName.trim();
  }
  
  // Extract name from email
  const emailLocalPart = email.split('@')[0];
  
  // Remove numbers, dots, underscores, hyphens
  let name = emailLocalPart.replace(/[0-9._-]/g, '');
  
  // If email has common name patterns like firstname.lastname
  if (emailLocalPart.includes('.')) {
    const parts = emailLocalPart.split('.');
    name = parts[0].replace(/[0-9_-]/g, '');
  }
  
  // Capitalize first letter and make rest lowercase
  name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  
  // Fallback if name is too short or empty
  if (!name || name.length < 2) {
    name = 'User';
  }
  
  return name;
}

export async function POST(req) {
  try {
    const { email, firstName } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate environment variables
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_EMAIL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars);
      return Response.json({ 
        error: 'SMTP configuration incomplete',
        missing: missingVars 
      }, { status: 500 });
    }

    console.log('Generating OTP for email:', email);

    // Generate and store OTP in database
    const otpResult = await generateAndStoreOTP(email);
    
    if (!otpResult.success) {
      console.error('OTP generation failed:', otpResult.message);
      return Response.json({ error: otpResult.message }, { status: 500 });
    }

    const otp = otpResult.otp;
    console.log('OTP generated successfully for:', email);

    // Extract or use provided firstName
    const userName = extractFirstName(email, firstName);
    console.log('Using name for personalization:', userName);

    const templatePath = path.join(process.cwd(), 'src/app/api/send-mail/template.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

    // Replace placeholders in HTML template
    htmlTemplate = htmlTemplate.replace(/{{otp}}/g, otp);
    htmlTemplate = htmlTemplate.replace(/{{firstName}}/g, userName);

    console.log('SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? '***masked***' : 'missing',
      pass: process.env.SMTP_PASS ? '***masked***' : 'missing'
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: process.env.NODE_ENV === 'development', // Enable debug in development
      logger: process.env.NODE_ENV === 'development' // Enable logger in development
    });

    const mailOptions = {
      from: `"Digital Library -   Vidya Bharati International School" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: `Email Verification for Digital Library - Welcome ${userName}!`,
      html: htmlTemplate,
    };

    console.log('Sending email to:', email);
    console.log('Mail options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    // Test SMTP connection first
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      return Response.json({ 
        error: 'SMTP configuration error', 
        details: verifyError.message 
      }, { status: 500 });
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', email);
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);

    return Response.json({ 
      message: 'OTP sent successfully',
      expiresIn: '5 minutes'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return Response.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
