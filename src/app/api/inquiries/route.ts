import { NextRequest, NextResponse } from 'next/server';
import { getInquiries, createInquiry, updateInquiryStatus, deleteInquiry } from '@/lib/db';

export async function GET() {
  try {
    const inquiries = getInquiries();
    return NextResponse.json(inquiries, { status: 200 });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve inquiries from database' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      trailId,
      trailName,
      fullName,
      email,
      phone,
      country,
      groupSize,
      preferredStartDate,
      fitnessLevel,
      notes
    } = body;

    if (!trailId || !trailName || !fullName || !email) {
      return NextResponse.json(
        { error: 'trailId, trailName, fullName, and email are required fields.' },
        { status: 400 }
      );
    }

    const saved = createInquiry({
      trailId: trailId.trim(),
      trailName: trailName.trim(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      country: country?.trim(),
      groupSize: Number(groupSize) || 1,
      preferredStartDate,
      fitnessLevel: fitnessLevel || 'Moderate',
      notes: notes?.trim()
    });

    return NextResponse.json(
      { message: 'Inquiry registered successfully', inquiry: saved },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to record inquiry in database' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required for updating an inquiry.' },
        { status: 400 }
      );
    }

    const success = updateInquiryStatus(id, status);
    if (!success) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Inquiry status updated', id, status }, { status: 200 });
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    return NextResponse.json(
      { error: 'Failed to update inquiry status in database' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Inquiry ID is required' }, { status: 400 });
    }

    const success = deleteInquiry(id);
    if (!success) {
      return NextResponse.json({ error: 'Inquiry not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Inquiry deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to delete inquiry from database' },
      { status: 500 }
    );
  }
}
