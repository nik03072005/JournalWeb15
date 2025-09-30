import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const { email } = await req.json();

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

    console.log('Testing email delivery to:', email);

    const transporter = nodemailer.createTransporter({
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
      debug: true, // Enable debug logs
      logger: true // Enable logger
    });

    // Test SMTP connection
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

    const mailOptions = {
      from: `"ShinePearl Test 📧" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'ShinePearl Email Delivery Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #003366;">Email Delivery Test</h2>
          <p>This is a test email to verify email delivery is working.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Timestamp: ${new Date().toISOString()}</li>
            <li>Recipient: ${email}</li>
            <li>SMTP Host: ${process.env.SMTP_HOST}</li>
            <li>SMTP Port: ${process.env.SMTP_PORT}</li>
          </ul>
          <p style="color: #28a745;">✅ If you received this email, the email delivery system is working correctly!</p>
        </div>
      `,
    };

    console.log('Sending test email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);

    return Response.json({ 
      message: 'Test email sent successfully',
      messageId: info.messageId,
      response: info.response
    });
    
  } catch (error) {
    console.error('Error sending test email:', error);
    return Response.json({ 
      error: 'Failed to send test email',
      details: error.message
    }, { status: 500 });
  }
}
