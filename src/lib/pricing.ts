import { createHmac, randomBytes, createHash } from 'node:crypto';

export interface BookingBreakdown {
  basePricePerPerson: number;
  travelers: number;
  baseTotal: number;
  discountPercent: number;
  discountAmount: number;
  discountedBaseTotal: number;
  timsFee: number;
  conservationFee: number;
  permitFeesTotal: number;
  vatAmount: number;
  totalAmount: number;
  paymentOption: 'FULL' | 'DEPOSIT';
  depositAmount: number;
  remainingBalance: number;
  paidAmount: number;
}

export interface CheckoutSessionData {
  sessionId: string;
  trailId: string;
  trailName?: string;
  travelers: number;
  startDate: string;
  paymentOption: 'FULL' | 'DEPOSIT';
  fullName: string;
  email: string;
  phone: string;
  emergencyContact?: string;
  specialRequests?: string;
  breakdown: BookingBreakdown;
  expiresAt: number;
}

const CHECKOUT_SECRET = process.env.CHECKOUT_SESSION_SECRET || 'himalayan_trails_gateway_secret_2026';

/**
 * Calculates itemized pricing breakdown with tiered group discounts,
 * regional permit fees (TIMS $20 + Conservation Area $30 per trekker),
 * and 13% Nepal VAT.
 */
export function calculateBookingBreakdown(params: {
  basePricePerPerson: number;
  travelers: number;
  paymentOption?: 'FULL' | 'DEPOSIT';
}): BookingBreakdown {
  const travelers = Math.max(1, Math.min(30, Math.floor(params.travelers || 1)));
  const basePricePerPerson = Math.max(0, Number(params.basePricePerPerson) || 850);
  const paymentOption = params.paymentOption === 'DEPOSIT' ? 'DEPOSIT' : 'FULL';

  // Tiered group discount: 0% for 1, 5% for 2-3, 10% for 4-7, 15% for 8+
  let discountPercent = 0;
  if (travelers >= 8) {
    discountPercent = 15;
  } else if (travelers >= 4) {
    discountPercent = 10;
  } else if (travelers >= 2) {
    discountPercent = 5;
  }

  const baseTotal = Math.round(basePricePerPerson * travelers * 100) / 100;
  const discountAmount = Math.round(baseTotal * (discountPercent / 100) * 100) / 100;
  const discountedBaseTotal = Math.round((baseTotal - discountAmount) * 100) / 100;

  // Regional permit fees: TIMS $20 + Conservation Area $30 per trekker
  const timsFee = 20 * travelers;
  const conservationFee = 30 * travelers;
  const permitFeesTotal = timsFee + conservationFee;

  // 13% Nepal VAT on taxable expedition services
  const vatAmount = Math.round(discountedBaseTotal * 0.13 * 100) / 100;

  // Total amount payable
  const totalAmount = Math.round((discountedBaseTotal + permitFeesTotal + vatAmount) * 100) / 100;

  let depositAmount = totalAmount;
  let remainingBalance = 0;

  if (paymentOption === 'DEPOSIT') {
    depositAmount = Math.round(totalAmount * 0.25 * 100) / 100;
    remainingBalance = Math.round((totalAmount - depositAmount) * 100) / 100;
  }

  const paidAmount = depositAmount;

  return {
    basePricePerPerson,
    travelers,
    baseTotal,
    discountPercent,
    discountAmount,
    discountedBaseTotal,
    timsFee,
    conservationFee,
    permitFeesTotal,
    vatAmount,
    totalAmount,
    paymentOption,
    depositAmount,
    remainingBalance,
    paidAmount
  };
}

/**
 * Generates an HMAC-signed cryptographic token for a checkout session.
 */
export function createCheckoutSessionToken(payload: CheckoutSessionData): string {
  const json = JSON.stringify(payload);
  const data = Buffer.from(json, 'utf8').toString('base64url');
  const signature = createHmac('sha256', CHECKOUT_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

/**
 * Validates and extracts checkout session data from an HMAC-signed token.
 */
export function verifyCheckoutSessionToken(token: string): CheckoutSessionData | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [data, signature] = parts;
    const expectedSig = createHmac('sha256', CHECKOUT_SECRET).update(data).digest('base64url');
    if (signature !== expectedSig) return null;

    const json = Buffer.from(data, 'base64url').toString('utf8');
    const parsed: CheckoutSessionData = JSON.parse(json);

    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Generates a formal receipt number in the format REC-2026-XXXXX.
 */
export function generateReceiptNumber(): string {
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `REC-2026-${digits}`;
}

/**
 * Generates a verification authenticity hash for official expedition vouchers.
 */
export function generateVoucherAuthenticityHash(
  bookingId: string,
  receiptNumber: string,
  createdAt: string
): string {
  const payload = `${bookingId}:${receiptNumber}:${createdAt}:NEPAL_TOURISM_CLEARANCE_2026`;
  const hash = createHash('sha256').update(payload).digest('hex').toUpperCase();
  return `HT-AUTH-${hash.substring(0, 16)}`;
}
