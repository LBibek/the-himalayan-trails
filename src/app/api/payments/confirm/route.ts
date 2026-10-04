import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { createBooking } from '@/lib/db';
import { verifyCheckoutSessionToken, generateReceiptNumber } from '@/lib/pricing';

function validateCardExpiry(expiry: string): boolean {
  if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry.trim())) return false;
  const [mmStr, yyStr] = expiry.trim().split('/');
  const mm = parseInt(mmStr, 10);
  const yy = parseInt('20' + yyStr, 10);
  if (mm < 1 || mm > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (yy < currentYear) return false;
  if (yy === currentYear && mm < currentMonth) return false;
  return true;
}

function validateCardNumber(num: string): boolean {
  const clean = num.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(clean)) return false;

  // Luhn algorithm verification
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken, paymentDetails } = body;

    if (!sessionToken || typeof sessionToken !== 'string') {
      return NextResponse.json(
        { error: 'Valid checkout session token is required to confirm payment' },
        { status: 400 }
      );
    }

    // Verify cryptographic HMAC token
    const sessionData = verifyCheckoutSessionToken(sessionToken);
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Checkout session is invalid or has expired. Please re-initiate booking checkout.' },
        { status: 400 }
      );
    }

    // Validate payment card details
    if (!paymentDetails || typeof paymentDetails !== 'object') {
      return NextResponse.json(
        { error: 'Payment card details are required' },
        { status: 400 }
      );
    }

    const { cardNumber, cardHolder, expiryDate, cvc } = paymentDetails;

    if (!cardHolder || typeof cardHolder !== 'string' || cardHolder.trim().length < 2) {
      return NextResponse.json(
        { error: 'Cardholder name is required as printed on card' },
        { status: 400 }
      );
    }

    if (!cardNumber || typeof cardNumber !== 'string' || !validateCardNumber(cardNumber)) {
      return NextResponse.json(
        { error: 'Invalid card number format or failed Luhn check. Please enter a valid Visa, Mastercard, or Amex.' },
        { status: 400 }
      );
    }

    if (!expiryDate || typeof expiryDate !== 'string' || !validateCardExpiry(expiryDate)) {
      return NextResponse.json(
        { error: 'Invalid or expired card expiration date (format: MM/YY)' },
        { status: 400 }
      );
    }

    const cleanCvc = cvc ? String(cvc).trim() : '';
    if (!cleanCvc || !/^\d{3,4}$/.test(cleanCvc)) {
      return NextResponse.json(
        { error: 'Invalid CVC / CVV security code (3 or 4 digits required)' },
        { status: 400 }
      );
    }

    // Check user session if logged in
    let authenticatedUserId: string | undefined = undefined;
    const sessionCookie = request.cookies.get('himalayan_auth_session')?.value;
    if (sessionCookie) {
      const authSession = verifySessionToken(sessionCookie);
      if (authSession?.userId) {
        authenticatedUserId = authSession.userId;
      }
    }

    // Generate formal receipt number REC-2026-XXXXX
    const receiptNumber = generateReceiptNumber();

    // Create ACID booking record in SQLite
    const booking = createBooking({
      trailId: sessionData.trailId,
      userId: authenticatedUserId,
      fullName: sessionData.fullName,
      email: sessionData.email,
      phone: sessionData.phone,
      startDate: sessionData.startDate,
      travelers: sessionData.travelers,
      specialRequests: sessionData.specialRequests,
      emergencyContact: sessionData.emergencyContact,
      totalPrice: sessionData.breakdown.totalAmount,
      paymentOption: sessionData.breakdown.paymentOption,
      depositAmount: sessionData.breakdown.depositAmount,
      remainingBalance: sessionData.breakdown.remainingBalance,
      basePrice: sessionData.breakdown.baseTotal,
      permitFee: sessionData.breakdown.permitFeesTotal,
      taxAmount: sessionData.breakdown.vatAmount,
      receiptNumber: receiptNumber,
      invoiceBreakdown: JSON.stringify(sessionData.breakdown),
      guideId: sessionData.guideId,
      porterCount: sessionData.porterCount,
      totalGearWeightKg: sessionData.totalGearWeightKg
    });

    return NextResponse.json({
      success: true,
      message: 'Expedition payment confirmed and official permit reservation recorded',
      receiptNumber,
      booking,
      voucherUrl: `/bookings/${booking.id}/voucher`
    }, { status: 201 });

  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: 'Internal server error processing payment confirmation' },
      { status: 500 }
    );
  }
}
