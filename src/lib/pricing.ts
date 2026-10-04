import { createHmac, randomBytes, createHash } from 'node:crypto';

export interface BookingBreakdown {
  basePricePerPerson: number;
  travelers: number;
  baseTotal: number;
  discountPercent: number;
  discountAmount: number;
  discountedBaseTotal: number;
  guideFee?: number;
  porterFee?: number;
  porterCount?: number;
  totalGearWeightKg?: number;
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
  guideId?: string;
  guideName?: string;
  porterCount?: number;
  totalGearWeightKg?: number;
  breakdown: BookingBreakdown;
  expiresAt: number;
}

const CHECKOUT_SECRET = process.env.CHECKOUT_SESSION_SECRET || 'himalayan_trails_gateway_secret_2026';

/**
 * Calculates itemized pricing breakdown with tiered group discounts,
 * regional permit fees (TIMS $20 + Conservation Area $30 per trekker),
 * optional Sherpa guide fees, porter wages and insurance,
 * and 13% Nepal VAT.
 */
export function calculateBookingBreakdown(params: {
  basePricePerPerson: number;
  travelers: number;
  paymentOption?: 'FULL' | 'DEPOSIT';
  guideDailyRate?: number;
  durationDays?: number;
  porterCount?: number;
  porterDailyRate?: number;
  totalGearWeightKg?: number;
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

  // Optional Guide fees
  const durationDays = Math.max(1, Number(params.durationDays) || 1);
  const guideDailyRate = Math.max(0, Number(params.guideDailyRate) || 0);
  const guideFee = guideDailyRate > 0 ? Math.round(guideDailyRate * durationDays * 100) / 100 : 0;

  // Optional Porter logistics ($25/day fair wage + $15 insurance + $10 equipment allowance per porter)
  const porterCount = Math.max(0, Math.floor(Number(params.porterCount) || 0));
  const porterDailyRate = Math.max(0, Number(params.porterDailyRate) || 25);
  const porterInsurance = porterCount > 0 ? porterCount * 15 : 0;
  const porterEquipment = porterCount > 0 ? porterCount * 10 : 0;
  const porterWages = porterCount > 0 ? porterCount * porterDailyRate * durationDays : 0;
  const porterFee = Math.round((porterWages + porterInsurance + porterEquipment) * 100) / 100;

  // Regional permit fees: TIMS $20 + Conservation Area $30 per trekker
  const timsFee = 20 * travelers;
  const conservationFee = 30 * travelers;
  const permitFeesTotal = timsFee + conservationFee;

  // 13% Nepal VAT on taxable expedition services (discounted base + guide + porters)
  const taxableSubtotal = discountedBaseTotal + guideFee + porterFee;
  const vatAmount = Math.round(taxableSubtotal * 0.13 * 100) / 100;

  // Total amount payable
  const totalAmount = Math.round((taxableSubtotal + permitFeesTotal + vatAmount) * 100) / 100;

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
    guideFee: guideFee > 0 ? guideFee : undefined,
    porterFee: porterFee > 0 ? porterFee : undefined,
    porterCount: porterCount > 0 ? porterCount : undefined,
    totalGearWeightKg: params.totalGearWeightKg,
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

export interface PorterCalculationRequest {
  groupSize: number;
  durationDays: number;
  totalGearWeightKg?: number;
  personalGearWeightPerPersonKg?: number;
  groupCampingEquipmentKg?: number;
  customPorterCount?: number;
}

export interface PorterCalculationResult {
  groupSize: number;
  durationDays: number;
  totalGearWeightKg: number;
  recommendedPorters: number;
  weightPerPorterKg: number;
  complianceStatus: 'OPTIMAL' | 'LEGAL_MAXIMUM' | 'OVERLOADED';
  complianceLabel: string;
  dailyRatePerPorterUsd: number;
  insurancePerPorterUsd: number;
  equipmentAllowancePerPorterUsd: number;
  totalBaseWagesUsd: number;
  totalInsuranceUsd: number;
  totalEquipmentUsd: number;
  totalPorterCostUsd: number;
  guidelinesSummary: string;
}

/**
 * Calculates required porters and TAAN fair wages enforcing IPPG ethical thresholds:
 * - Recommended load: 20-25 kg per porter
 * - Legal maximum ceiling: 30 kg per porter
 * - Fair compensation: $25/day wage, $15 insurance, $10 equipment allowance
 */
export function calculatePorterLogistics(
  request: PorterCalculationRequest & { customPorterCount?: number }
): PorterCalculationResult {
  const groupSize = Math.max(1, Math.min(50, Math.floor(Number(request.groupSize) || 1)));
  const durationDays = Math.max(1, Math.min(60, Math.floor(Number(request.durationDays) || 1)));

  let totalGearWeightKg = 0;
  const rawTotal = Number(request.totalGearWeightKg);
  if (!isNaN(rawTotal) && rawTotal > 0) {
    totalGearWeightKg = Math.round(rawTotal * 10) / 10;
  } else {
    const rawPersonal = Number(request.personalGearWeightPerPersonKg);
    const personalWeightPerPerson = (!isNaN(rawPersonal) && rawPersonal > 0)
      ? Math.max(5, Math.min(30, rawPersonal))
      : 12; // 12kg standard personal duffel
    const rawCamping = Number(request.groupCampingEquipmentKg);
    const groupCampingWeight = (!isNaN(rawCamping) && rawCamping >= 0)
      ? rawCamping
      : (groupSize >= 4 ? 20 : 10);
    totalGearWeightKg = Math.round((groupSize * personalWeightPerPerson + groupCampingWeight) * 10) / 10;
  }

  // IPPG Guidelines:
  // Recommended ethical load: 20-25 kg per porter
  // Legal absolute ceiling: 30 kg per porter
  const recommendedPorters = Math.max(1, Math.ceil(totalGearWeightKg / 25));

  const rawCustom = Number(request.customPorterCount);
  const effectivePorters = (!isNaN(rawCustom) && rawCustom > 0)
    ? Math.max(1, Math.floor(rawCustom))
    : recommendedPorters;

  const weightPerPorterKg = Math.round((totalGearWeightKg / effectivePorters) * 10) / 10;

  let complianceStatus: 'OPTIMAL' | 'LEGAL_MAXIMUM' | 'OVERLOADED';
  let complianceLabel: string;

  if (weightPerPorterKg <= 25) {
    complianceStatus = 'OPTIMAL';
    complianceLabel = 'Optimal / IPPG Ethical Guidelines (Under 25kg)';
  } else if (weightPerPorterKg <= 30) {
    complianceStatus = 'LEGAL_MAXIMUM';
    complianceLabel = 'Legal Maximum (25kg - 30kg) - Heavy Load';
  } else {
    complianceStatus = 'OVERLOADED';
    complianceLabel = 'Overloaded (>30kg) - Exceeds IPPG Alpine Porter Safety Limit';
  }

  // TAAN Standard Fair Wages & Logistics Fees
  const dailyRatePerPorterUsd = 25; // $25/day fair wage
  const insurancePerPorterUsd = 15; // $15 mandatory medical & evacuation insurance per porter
  const equipmentAllowancePerPorterUsd = 10; // $10 high-altitude equipment allowance per porter

  const totalBaseWagesUsd = Math.round(effectivePorters * dailyRatePerPorterUsd * durationDays * 100) / 100;
  const totalInsuranceUsd = Math.round(effectivePorters * insurancePerPorterUsd * 100) / 100;
  const totalEquipmentUsd = Math.round(effectivePorters * equipmentAllowancePerPorterUsd * 100) / 100;
  const totalPorterCostUsd = Math.round((totalBaseWagesUsd + totalInsuranceUsd + totalEquipmentUsd) * 100) / 100;

  return {
    groupSize,
    durationDays,
    totalGearWeightKg,
    recommendedPorters,
    weightPerPorterKg,
    complianceStatus,
    complianceLabel,
    dailyRatePerPorterUsd,
    insurancePerPorterUsd,
    equipmentAllowancePerPorterUsd,
    totalBaseWagesUsd,
    totalInsuranceUsd,
    totalEquipmentUsd,
    totalPorterCostUsd,
    guidelinesSummary: `IPPG and TAAN standard: maximum load 30kg, recommended 20-25kg. Current allocation: ${weightPerPorterKg}kg/porter across ${effectivePorters} porter${effectivePorters > 1 ? 's' : ''}.`
  };
}
