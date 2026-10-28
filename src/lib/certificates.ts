import crypto from 'node:crypto';
import type { HighAltitudeCertificate, CertificateVerificationResponse } from '../types/certificate';
import {
  getBookingById,
  getCertificateById,
  getCertificateByBookingId,
  getCertificateByVerificationCode,
  createCertificate
} from './db.ts';

const CERT_SIGNING_SECRET = process.env.CERT_SIGNING_SECRET || 'himalayan-trails-ifmga-cryptographic-salt-2026';

/**
 * Generate a unique, deterministic cryptographic verification code
 * in the format CERT-YYYY-XXXXX (e.g. CERT-2026-F89A2).
 */
export function generateCertificateCode(bookingId: string, completionDate: string): string {
  const d = new Date(completionDate);
  const year = (completionDate && !isNaN(d.getTime())) ? d.getFullYear() : 2026;
  const hash = crypto
    .createHmac('sha256', CERT_SIGNING_SECRET)
    .update(`cert:${bookingId}:${completionDate}`)
    .digest('hex')
    .toUpperCase();
  
  const uniqueSegment = hash.slice(0, 5);
  return `CERT-${year}-${uniqueSegment}`;
}

/**
 * Generates an IFMGA Chief Guide digital signature hash.
 */
export function generateDigitalSignature(
  verificationCode: string,
  adventurerName: string,
  maxElevation: number,
  trailName: string
): string {
  return crypto
    .createHmac('sha256', CERT_SIGNING_SECRET)
    .update(`sig:${verificationCode}:${adventurerName}:${maxElevation}:${trailName}:PasangSherpa_IFMGA`)
    .digest('hex');
}

/**
 * Issues or retrieves a verifiable High-Altitude Completion Certificate for a booking.
 */
export function issueHighAltitudeCertificate(bookingId: string): HighAltitudeCertificate {
  // Check if certificate already exists
  const existing = getCertificateByBookingId(bookingId);
  if (existing) {
    return existing;
  }

  const booking = getBookingById(bookingId);
  if (!booking) {
    throw new Error(`Expedition booking '${bookingId}' not found for certificate issuance`);
  }

  if (booking.status === 'CANCELLED') {
    throw new Error('Cannot issue high-altitude completion certificate for cancelled expedition bookings');
  }

  // Calculate completion date based on start date and duration days
  let completionDate = booking.startDate;
  if (booking.durationDays && booking.startDate) {
    try {
      const start = new Date(booking.startDate);
      if (!isNaN(start.getTime())) {
        const end = new Date(start.getTime() + (booking.durationDays - 1) * 86400000);
        completionDate = end.toISOString().split('T')[0];
      }
    } catch {
      completionDate = booking.startDate;
    }
  }

  const adventurerName = booking.fullName;
  const trailName = booking.trailName || 'Himalayan High-Altitude Expedition';
  const trailSlug = booking.trailSlug || 'everest-base-camp';
  const maxElevation = booking.maxElevation || 5364;
  const totalDistanceKm = booking.trailDistanceKm || (booking.durationDays ? booking.durationDays * 10 : 130);

  const verificationCode = generateCertificateCode(booking.id, completionDate);
  const chiefGuideName = 'Pasang Sherpa, IFMGA';
  const chiefGuideTitle = 'Chief Expedition Leader & IFMGA / UIAGM Mountain Guide (#NMA-0142)';
  const digitalSignatureHash = generateDigitalSignature(
    verificationCode,
    adventurerName,
    maxElevation,
    trailName
  );

  return createCertificate({
    bookingId: booking.id,
    verificationCode,
    adventurerName,
    trailName,
    trailSlug,
    maxElevation,
    totalDistanceKm,
    completionDate,
    chiefGuideName,
    chiefGuideTitle,
    digitalSignatureHash,
  });
}

/**
 * Validates a certificate verification code and checks cryptographic integrity.
 */
export function verifyCertificate(identifier: string): CertificateVerificationResponse {
  if (!identifier || typeof identifier !== 'string') {
    return {
      valid: false,
      error: 'Invalid verification identifier',
      verifiedAt: new Date().toISOString()
    };
  }

  const normalized = identifier.trim();
  const cert =
    getCertificateByVerificationCode(normalized) ||
    getCertificateById(normalized) ||
    getCertificateByBookingId(normalized);

  if (!cert) {
    return {
      valid: false,
      error: `Official high-altitude certificate not found matching '${normalized}'`,
      verifiedAt: new Date().toISOString()
    };
  }

  // Verify cryptographic digital signature
  const expectedSignature = generateDigitalSignature(
    cert.verificationCode,
    cert.adventurerName,
    cert.maxElevation,
    cert.trailName
  );

  const isValid = cert.digitalSignatureHash === expectedSignature;

  if (!isValid) {
    return {
      valid: false,
      certificate: cert,
      error: 'Cryptographic signature mismatch: certificate may have been altered',
      verifiedAt: new Date().toISOString()
    };
  }

  return {
    valid: true,
    certificate: cert,
    verifiedAt: new Date().toISOString()
  };
}
