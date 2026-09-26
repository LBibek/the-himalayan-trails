import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { getBookingsByUserId } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('himalayan_auth_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to view bookings' },
        { status: 401 }
      );
    }

    const session = verifySessionToken(sessionCookie);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Session invalid or expired' },
        { status: 401 }
      );
    }

    const bookings = getBookingsByUserId(session.userId);

    return NextResponse.json({
      success: true,
      count: bookings.length,
      bookings
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching bookings' },
      { status: 500 }
    );
  }
}
