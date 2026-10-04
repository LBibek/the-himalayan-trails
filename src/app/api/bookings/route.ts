import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getBookings, getTrailBySlug, getGuideById } from '@/lib/db';

export async function GET() {
  try {
    const bookings = getBookings();
    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve bookings from database' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      trailId,
      fullName,
      email,
      phone,
      startDate,
      travelers,
      specialRequests,
      guideId,
      porterCount,
      totalGearWeightKg
    } = body;

    if (!trailId || !fullName || !email || !phone || !startDate || !travelers) {
      return NextResponse.json(
        { error: 'Missing required booking details (trail, name, email, phone, date, travelers)' },
        { status: 400 }
      );
    }

    if (travelers < 1 || travelers > 30) {
      return NextResponse.json(
        { error: 'Travelers count must be between 1 and 30' },
        { status: 400 }
      );
    }

    // Verify trail exists in DB
    const trail = getTrailBySlug(trailId);
    const basePricePerPerson = 850; // default base price
    const totalPrice = body.totalPrice || (travelers * basePricePerPerson);

    // Validate guide if requested
    let validGuideId: string | undefined = undefined;
    if (guideId && typeof guideId === 'string' && guideId.trim() !== '') {
      const guide = getGuideById(guideId.trim());
      if (!guide) {
        return NextResponse.json(
          { error: `Requested Sherpa Guide '${guideId}' was not found in certified registry` },
          { status: 404 }
        );
      }
      validGuideId = guide.id;
    }

    const booking = createBooking({
      trailId: trail ? trail.id : trailId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      startDate,
      travelers: Number(travelers),
      specialRequests: specialRequests ? specialRequests.trim() : undefined,
      totalPrice: Number(totalPrice),
      guideId: validGuideId,
      porterCount: porterCount ? Number(porterCount) : undefined,
      totalGearWeightKg: totalGearWeightKg ? Number(totalGearWeightKg) : undefined
    });

    return NextResponse.json(
      {
        message: 'Booking confirmed and recorded in database',
        booking
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to process booking in database' },
      { status: 500 }
    );
  }
}
