import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

import User from '@/models/userModel';
import { connectToDatabase } from '@/lib/db';

// Helper function to extract and format first name
function extractFirstName(email, firstName = null, lastName = null) {
  if (firstName && firstName.trim()) {
    return firstName.trim();
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
    const { itemDetails } = await req.json();

    if (!itemDetails) {
      return NextResponse.json({ error: 'Item details are required' }, { status: 400 });
    }

    // Validate environment variables
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_EMAIL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars);
      return NextResponse.json({ 
        error: 'SMTP configuration incomplete',
        missing: missingVars 
      }, { status: 500 });
    }

    // Connect to database
    await connectToDatabase();

    // Fetch all users from database
    const users = await User.find({}, 'firstname lastname email').lean();
    
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No users found to notify' }, { status: 404 });
    }

    console.log(`Found ${users.length} users to notify about new item: ${itemDetails.title}`);

    // Read HTML template
    const templatePath = path.join(process.cwd(), 'src/app/api/send-mail/new-item-notification/template.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

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
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development'
    });

    // Test SMTP connection first
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      return NextResponse.json({ 
        error: 'SMTP configuration error', 
        details: verifyError.message 
      }, { status: 500 });
    }

    let successCount = 0;
    let failureCount = 0;
    const failedEmails = [];

    // Send emails to all users
    for (const user of users) {
      try {
        const userName = extractFirstName(user.email, user.firstname, user.lastname);
        
        // Replace placeholders in HTML template for each user
        let personalizedTemplate = htmlTemplate
          .replace(/{{firstName}}/g, userName)
          .replace(/{{itemTitle}}/g, itemDetails.title || 'New Item')
          .replace(/{{itemType}}/g, itemDetails.type || 'Document')
          .replace(/{{itemAbstract}}/g, itemDetails.abstract || 'No abstract available')
          .replace(/{{creators}}/g, itemDetails.creators?.map(c => `${c.firstName} ${c.lastName}`).join(', ') || 'Unknown')
          .replace(/{{date}}/g, itemDetails.date ? new Date(itemDetails.date).toLocaleDateString() : new Date().toLocaleDateString())
          .replace(/{{_id}}/g, itemDetails._id || '');

        const mailOptions = {
          from: `"Digital Library -  Vidya Bharati International School" <${process.env.SMTP_EMAIL}>`,
          to: user.email,
          subject: `New ${itemDetails.type || 'Item'} Added to Digital Library - ${itemDetails.title || 'Check it out!'}`,
          html: personalizedTemplate,
        };

        await transporter.sendMail(mailOptions);
        successCount++;
        console.log(`Email sent successfully to: ${user.email}`);
        
        // Add small delay to avoid overwhelming the SMTP server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (emailError) {
        failureCount++;
        failedEmails.push(user.email);
        console.error(`Failed to send email to ${user.email}:`, emailError.message);
      }
    }

    console.log(`Email notification summary: ${successCount} successful, ${failureCount} failed`);

    return NextResponse.json({ 
      message: 'New item notification emails processed',
      summary: {
        totalUsers: users.length,
        successCount,
        failureCount,
        failedEmails: failedEmails.length > 0 ? failedEmails : undefined
      }
    });

  } catch (error) {
    console.error('Error sending new item notification emails:', error);
    return NextResponse.json({ 
      error: 'Failed to send notification emails', 
      details: error.message 
    }, { status: 500 });
  }
}
