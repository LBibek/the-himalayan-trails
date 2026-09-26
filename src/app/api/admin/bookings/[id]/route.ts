import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { updateBookingStatus, deleteBooking } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        { error: 'Valid status string is required' },
        { status: 400 }
      );
    }

    const updated = updateBookingStatus(id, status);
    if (!updated) {
      return NextResponse.json(
        { error: 'Booking not found or not updated' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Booking ${id} status updated to ${status}`
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Internal server error updating booking' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteBooking(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Booking not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Booking ${id} successfully removed`
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: 'Internal server error deleting booking' },
      { status: 500 }
    );
  }
}
