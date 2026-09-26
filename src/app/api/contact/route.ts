import { NextRequest, NextResponse } from 'next/server';
import { createContactMessage } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required fields' },
        { status: 400 }
      );
    }

    const saved = createContactMessage({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: (subject || 'General Inquiry').trim(),
      message: message.trim()
    });

    return NextResponse.json(
      { message: 'Inquiry received and recorded in database', inquiry: saved },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording contact inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to record inquiry in database' },
      { status: 500 }
    );
  }
}
