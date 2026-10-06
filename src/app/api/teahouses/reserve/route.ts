import { NextRequest, NextResponse } from 'next/server';
import { createTeahouseReservation, getTeahouseById } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      teahouseId,
      guestName,
      guestEmail,
      guestPhone,
      checkInDate,
      guestsCount,
      roomType,
      dietaryNotes,
      totalPriceUsd,
      userId,
    } = body;

    if (!teahouseId || !guestName || !guestEmail || !checkInDate || !roomType) {
      return NextResponse.json(
        { error: 'Missing required reservation fields: teahouseId, guestName, guestEmail, checkInDate, and roomType are mandatory' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail.trim())) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkInDate.trim())) {
      return NextResponse.json(
        { error: 'checkInDate must be in YYYY-MM-DD ISO format' },
        { status: 400 }
      );
    }

    const checkIn = new Date(checkInDate.trim());
    if (isNaN(checkIn.getTime())) {
      return NextResponse.json(
        { error: 'checkInDate is not a valid date' },
        { status: 400 }
      );
    }

    const parsedGuestsCount = Number(guestsCount);
    if (!Number.isInteger(parsedGuestsCount) || parsedGuestsCount < 1 || parsedGuestsCount > 20) {
      return NextResponse.json(
        { error: 'Guests count must be an integer between 1 and 20' },
        { status: 400 }
      );
    }

    const teahouse = getTeahouseById(teahouseId);
    if (!teahouse) {
      return NextResponse.json(
        { error: `Teahouse '${teahouseId}' does not exist` },
        { status: 404 }
      );
    }

    const reservation = createTeahouseReservation({
      teahouseId,
      userId,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone ? guestPhone.trim() : undefined,
      checkInDate,
      guestsCount: parsedGuestsCount,
      roomType: roomType.trim(),
      dietaryNotes: dietaryNotes ? dietaryNotes.trim() : undefined,
      totalPriceUsd: typeof totalPriceUsd === 'number' ? totalPriceUsd : undefined,
    });

    return NextResponse.json({
      success: true,
      reservation,
      message: `Reservation confirmed at ${teahouse.name} for ${guestName.trim()}`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating teahouse reservation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process teahouse reservation' },
      { status: 500 }
    );
  }
}
