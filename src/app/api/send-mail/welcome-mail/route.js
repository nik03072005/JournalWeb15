import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const { email, firstName, loginUrl } = await req.json();

    if (!email || !firstName) {
      return Response.json({ error: 'Email and firstName are required' }, { status: 400 });
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

    console.log('Sending welcome email to:', email);

    // Read the welcome email template
    const templatePath = path.join(process.cwd(), 'src/app/api/send-mail/welcome-mail/template.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

    // Replace placeholders in the template
    htmlTemplate = htmlTemplate.replace(/{{firstName}}/g, firstName);
    htmlTemplate = htmlTemplate.replace(/{{userEmail}}/g, email);
    htmlTemplate = htmlTemplate.replace(/{{loginUrl}}/g, loginUrl || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth?tab=signin`);

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

    const mailOptions = {
      from: `"Digital Library -  Vidya Bharati International School 🎓" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Welcome to Digital Library -  Vidya Bharati International School',
      html: htmlTemplate,
    };

    console.log('Sending welcome email to:', email);
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
    console.log('Welcome email sent successfully to:', email);
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);

    return Response.json({ 
      message: 'Welcome email sent successfully',
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return Response.json({ 
      error: 'Failed to send welcome email',
      details: error.message 
    }, { status: 500 });
  }
}
