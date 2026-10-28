import { NextRequest, NextResponse } from 'next/server';
import {
  issueHighAltitudeCertificate,
  verifyCertificate
} from '@/lib/certificates';
import { getBookingById } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Certificate or Booking ID is required' }, { status: 400 });
    }

    // Try finding/verifying existing certificate first
    const verification = verifyCertificate(id);
    if (verification.valid && verification.certificate) {
      return NextResponse.json({
        success: true,
        certificate: verification.certificate,
        verifiedAt: verification.verifiedAt
      }, { status: 200 });
    }

    // If not found by certificate code/id, check if it's a booking ID to issue/retrieve
    const booking = getBookingById(id);
    if (booking) {
      const certificate = issueHighAltitudeCertificate(booking.id);
      return NextResponse.json({
        success: true,
        certificate,
        verifiedAt: new Date().toISOString()
      }, { status: 200 });
    }

    return NextResponse.json({
      error: `Certificate or booking with identifier '${id}' not found`
    }, { status: 404 });
  } catch (error: any) {
    console.error('Error handling certificate request:', error);
    const isValidationErr = error?.message?.includes('Cannot issue') || error?.message?.includes('not found');
    return NextResponse.json({
      error: error?.message || 'Internal server error processing certificate'
    }, { status: isValidationErr ? 400 : 500 });
  }
}
