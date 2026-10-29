import { NextRequest, NextResponse } from 'next/server';
import { getGroupExpeditionByToken } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Valid expedition share token or ID is required' }, { status: 400 });
    }

    const expedition = getGroupExpeditionByToken(token.trim());
    if (!expedition) {
      return NextResponse.json(
        { error: `Group expedition with token '${token}' was not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      expedition
    }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching group expedition by token:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error retrieving expedition' },
      { status: 500 }
    );
  }
}
