export interface HighAltitudeCertificate {
  id: string;
  bookingId: string;
  verificationCode: string; // CERT-YYYY-XXXXX
  adventurerName: string;
  trailName: string;
  trailSlug: string;
  maxElevation: number;
  totalDistanceKm: number;
  completionDate: string;
  chiefGuideName: string;
  chiefGuideTitle: string;
  digitalSignatureHash: string;
  createdAt: string;
}

export interface CertificateVerificationResponse {
  valid: boolean;
  certificate?: HighAltitudeCertificate;
  error?: string;
  verifiedAt: string;
}
