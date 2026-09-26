import { NextRequest, NextResponse } from 'next/server';
import { getContactMessages, createContactMessage, updateContactMessageStatus, deleteContactMessage } from '@/lib/db';

export async function GET() {
  try {
    const messages = getContactMessages();
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve contact messages from database' },
      { status: 500 }
    );
  }
}

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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required for updating contact message status' },
        { status: 400 }
      );
    }

    const success = updateContactMessageStatus(id, status);
    if (!success) {
      return NextResponse.json({ error: 'Contact message not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Contact message status updated', id, status }, { status: 200 });
  } catch (error) {
    console.error('Error updating contact message status:', error);
    return NextResponse.json(
      { error: 'Failed to update message status in database' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const success = deleteContactMessage(id);
    if (!success) {
      return NextResponse.json({ error: 'Message not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Message deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message from database' },
      { status: 500 }
    );
  }
}
