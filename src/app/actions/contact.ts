'use server';

import { createContactMessage } from '@/lib/db';

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}

export async function submitContactMessage(input: ContactInput): Promise<ContactResponse> {
  const errors: Record<string, string> = {};

  if (!input.name || input.name.trim().length < 2) {
    errors.name = 'Please provide your full name.';
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.email = 'Please provide a valid email address.';
  }
  if (!input.subject || input.subject.trim().length < 3) {
    errors.subject = 'Subject line is required.';
  }
  if (!input.message || input.message.trim().length < 10) {
    errors.message = 'Please provide a message with at least 10 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: 'Please fill in all required fields correctly.',
      errors,
    };
  }

  try {
    createContactMessage({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      subject: input.subject.trim(),
      message: input.message.trim()
    });

    return {
      success: true,
      message: 'Thank you for reaching out! Your message has been saved in our database and our team in Kathmandu will respond shortly.'
    };
  } catch (err) {
    console.error('[Contact Submission Database Error]:', err);
    return {
      success: false,
      message: 'A database error occurred while saving your message. Please try again.'
    };
  }
}
