import { NextRequest, NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // Sample item data for testing
    const testItemDetails = {
      title: "Sample Research Paper on Digital Libraries",
      type: "Research Papers",
      abstract: "This is a sample abstract for testing purposes. It demonstrates how the email notification system works when a new item is added to the digital library.",
      creators: [
        { firstName: "Dr. John", lastName: "Doe" },
        { firstName: "Jane", lastName: "Smith" }
      ],
      date: new Date().toISOString(),
    };

    // Call the actual notification endpoint
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const notificationUrl = `${baseUrl}/send-mail/new-item-notification`;

    const response = await fetch(notificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemDetails: testItemDetails
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send test notifications');
    }

    return NextResponse.json({
      message: 'Test email notifications sent successfully',
      testData: testItemDetails,
      emailResult: result
    });

  } catch (error) {
    console.error('Error sending test email notifications:', error);
    return NextResponse.json({ 
      error: 'Failed to send test email notifications', 
      details: error.message 
    }, { status: 500 });
  }
}
