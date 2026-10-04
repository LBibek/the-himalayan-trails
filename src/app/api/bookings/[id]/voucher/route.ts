import { NextRequest, NextResponse } from 'next/server';
import { getBookingById } from '@/lib/db';
import { generateVoucherAuthenticityHash, calculateBookingBreakdown } from '@/lib/pricing';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const booking = getBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: `Expedition booking '${id}' not found` }, { status: 404 });
    }

    // Receipt number fallback if legacy record
    const receiptNumber = booking.receiptNumber || `REC-2026-${booking.id.slice(-5).toUpperCase()}`;

    // Generate cryptographic authenticity hash
    const authenticityHash = generateVoucherAuthenticityHash(
      booking.id,
      receiptNumber,
      booking.createdAt
    );

    // Parse or calculate invoice breakdown
    let breakdown: any = null;
    if (booking.invoiceBreakdown) {
      try {
        breakdown = JSON.parse(booking.invoiceBreakdown);
      } catch {
        breakdown = null;
      }
    }

    if (!breakdown) {
      const basePerPerson = booking.basePrice && booking.travelers
        ? Math.round(booking.basePrice / booking.travelers)
        : Math.round(booking.totalPrice / booking.travelers);

      breakdown = calculateBookingBreakdown({
        basePricePerPerson: basePerPerson,
        travelers: booking.travelers,
        paymentOption: booking.paymentOption
      });
    }

    const voucherData = {
      header: 'The Himalayan Trails — Official Expedition Voucher & Permit Clearance',
      receiptNumber,
      bookingId: booking.id,
      issueDate: booking.createdAt,
      status: booking.status,
      authenticityHash,
      verificationQrValue: `https://the-himalayan-trails.vercel.app/bookings/${booking.id}/voucher`,
      adventurer: {
        fullName: booking.fullName,
        email: booking.email,
        phone: booking.phone,
        groupSize: booking.travelers,
        emergencyContact: booking.emergencyContact || 'Direct Contact via SAR Dispatch'
      },
      expedition: {
        trailId: booking.trailId,
        trailName: booking.trailName || 'Classic Himalayan Route',
        trailSlug: booking.trailSlug,
        region: booking.region || 'Khumbu / Everest',
        startDate: booking.startDate,
        durationDays: booking.durationDays || 12,
        startPoint: booking.startPoint || 'Lukla Trailhead (2,860m)',
        endPoint: booking.endPoint || 'Lukla Trailhead (2,860m)',
        maxAltitude: booking.maxElevation ? `${booking.maxElevation}m` : '5,364m'
      },
      financialStatement: {
        basePackagePrice: breakdown.baseTotal ?? booking.basePrice ?? booking.totalPrice,
        tieredGroupDiscount: breakdown.discountAmount ?? 0,
        discountPercent: breakdown.discountPercent ?? 0,
        permitFeesBreakdown: {
          timsFee: breakdown.timsFee ?? (20 * booking.travelers),
          conservationAreaFee: breakdown.conservationFee ?? (30 * booking.travelers),
          totalPermits: breakdown.permitFeesTotal ?? booking.permitFee ?? (50 * booking.travelers)
        },
        nepalVat: breakdown.vatAmount ?? booking.taxAmount ?? Math.round((breakdown.discountedBaseTotal || booking.totalPrice) * 0.13),
        totalAmount: breakdown.totalAmount ?? booking.totalPrice,
        paymentOption: booking.paymentOption || 'FULL',
        paidAmount: booking.depositAmount ?? (booking.paymentOption === 'DEPOSIT' ? Math.round(booking.totalPrice * 0.25) : booking.totalPrice),
        outstandingBalance: booking.remainingBalance ?? (booking.paymentOption === 'DEPOSIT' ? Math.round(booking.totalPrice * 0.75) : 0),
        currency: 'USD',
        paymentTermsNotice: (booking.remainingBalance && booking.remainingBalance > 0)
          ? `Outstanding balance of $${booking.remainingBalance} is due in cash (USD/NPR) or card at the Kathmandu Basecamp Expedition Briefing.`
          : 'Expedition package fully paid. No outstanding expedition balance.'
      },
      protocols: {
        timsVerification: 'TIMS biometric verification at Tourist Service Center Bhrikutimandap Kathmandu',
        mandatoryInsurance: 'Mandatory travel insurance with $6,000m helicopter evacuation rider',
        sarHotline: '+977-1-4123456',
        liaisonNotice: 'Show this voucher and your original passport at Bhrikutimandap Tourist Service Center for permit issuance.'
      }
    };

    return NextResponse.json({
      success: true,
      voucher: voucherData
    }, { status: 200 });

  } catch (error) {
    console.error('Error retrieving voucher data:', error);
    return NextResponse.json(
      { error: 'Internal server error retrieving expedition voucher' },
      { status: 500 }
    );
  }
}
