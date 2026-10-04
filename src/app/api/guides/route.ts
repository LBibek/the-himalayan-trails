import { NextRequest, NextResponse } from 'next/server';
import { getGuides } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certification = searchParams.get('certification') || undefined;
    const region = searchParams.get('region') || undefined;
    const isAvailableParam = searchParams.get('available');
    const isAvailable = isAvailableParam !== null ? isAvailableParam === 'true' || isAvailableParam === '1' : undefined;

    const guides = getGuides({
      certification,
      region,
      isAvailable
    });

    return NextResponse.json({
      success: true,
      guides,
      count: guides.length
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching certified guides:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve certified Sherpa guides from database' },
      { status: 500 }
    );
  }
}
