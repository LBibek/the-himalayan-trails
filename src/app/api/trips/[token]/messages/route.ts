import { NextRequest, NextResponse } from 'next/server';
import {
  getGroupExpeditionByToken,
  getExpeditionMessages,
  createExpeditionMessage
} from '@/lib/db';

interface RouteContext {
  params: Promise<{
    token: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { token } = await context.params;
    if (!token) {
      return NextResponse.json(
        { error: 'Missing expedition share token' },
        { status: 400 }
      );
    }

    const expedition = getGroupExpeditionByToken(token);
    if (!expedition) {
      return NextResponse.json(
        { error: `Group expedition with token '${token}' not found` },
        { status: 404 }
      );
    }

    const messages = getExpeditionMessages(expedition.id);

    return NextResponse.json(
      {
        success: true,
        expeditionId: expedition.id,
        messages
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Error fetching expedition messages:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error fetching expedition messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { token } = await context.params;
    if (!token) {
      return NextResponse.json(
        { error: 'Missing expedition share token' },
        { status: 400 }
      );
    }

    const expedition = getGroupExpeditionByToken(token);
    if (!expedition) {
      return NextResponse.json(
        { error: `Group expedition with token '${token}' not found` },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid JSON request payload' },
        { status: 400 }
      );
    }

    const { senderName, senderEmail, senderRole, messageText, category } = body;

    if (!messageText || typeof messageText !== 'string' || messageText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Field "messageText" is required and cannot be empty' },
        { status: 400 }
      );
    }

    const cleanSenderName = (senderName && typeof senderName === 'string' && senderName.trim().length > 0)
      ? senderName.trim()
      : 'Expedition Member';

    const validRoles = ['LEADER', 'MEMBER', 'GUIDE', 'SYSTEM'];
    const cleanRole = validRoles.includes(senderRole) ? senderRole : 'MEMBER';

    const validCategories = ['GENERAL', 'LOGISTICS', 'GEAR', 'URGENT', 'WEATHER'];
    const cleanCategory = validCategories.includes(category) ? category : 'GENERAL';

    const newMessage = createExpeditionMessage({
      expeditionId: expedition.id,
      senderName: cleanSenderName,
      senderEmail: typeof senderEmail === 'string' ? senderEmail.trim() : undefined,
      senderRole: cleanRole as any,
      messageText: messageText.trim(),
      category: cleanCategory as any
    });

    return NextResponse.json(
      {
        success: true,
        message: newMessage
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error creating expedition message:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error posting message' },
      { status: 500 }
    );
  }
}
