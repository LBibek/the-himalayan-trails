import { NextRequest, NextResponse } from 'next/server';
import { getGroupExpeditionsForUser, getAllGroupExpeditions, getUserByEmail } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');
    const userParam = searchParams.get('user');

    // Also check session cookie if available
    const sessionCookie = request.cookies.get('session_token')?.value;

    const identifier = emailParam || userParam || (sessionCookie ? 'usr_trekker_1' : undefined);

    if (identifier) {
      const expeditions = getGroupExpeditionsForUser(identifier);
      return NextResponse.json({ success: true, expeditions }, { status: 200 });
    }

    // Default to all active group expeditions if no user specified
    const expeditions = getAllGroupExpeditions();
    return NextResponse.json({ success: true, expeditions }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching user group expeditions:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
