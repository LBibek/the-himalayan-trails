'use server';

import { createInquiry } from '@/lib/db';

export interface TrekInquiryInput {
  trailId: string;
  trailName: string;
  fullName: string;
  email: string;
  phone?: string;
  country?: string;
  groupSize: number;
  preferredStartDate?: string;
  fitnessLevel?: string;
  notes?: string;
}

export interface InquiryResponse {
  success: boolean;
  message: string;
  inquiryId?: string;
  errors?: Record<string, string>;
}

export async function submitTrekInquiry(input: TrekInquiryInput): Promise<InquiryResponse> {
  // 1. Validation
  const errors: Record<string, string> = {};
  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.fullName = 'Full name is required (minimum 2 characters)';
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.email = 'A valid email address is required';
  }
  if (!input.groupSize || input.groupSize < 1) {
    errors.groupSize = 'Group size must be at least 1 person';
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: 'Please resolve the highlighted errors below.',
      errors,
    };
  }

  // 2. Persist to SQLite Database
  try {
    const { id } = createInquiry({
      trailId: input.trailId,
      trailName: input.trailName,
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim(),
      country: input.country?.trim(),
      groupSize: Number(input.groupSize),
      preferredStartDate: input.preferredStartDate,
      fitnessLevel: input.fitnessLevel || 'Intermediate',
      notes: input.notes?.trim()
    });

    return {
      success: true,
      message: `Thank you, ${input.fullName}! Your expedition inquiry for ${input.trailName} has been recorded in our persistent database. Our Himalayan lead guide will get in touch within 24 hours.`,
      inquiryId: id
    };
  } catch (err) {
    console.error('[Inquiry Database Error]:', err);
    return {
      success: false,
      message: 'A database error occurred while recording your inquiry. Please try again.'
    };
  }
}
