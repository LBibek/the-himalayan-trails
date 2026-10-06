import { NextRequest, NextResponse } from 'next/server';
import { getTeahouses } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || undefined;
    const village = searchParams.get('village') || undefined;
    const amenity = searchParams.get('amenity') || undefined;

    const teahouses = getTeahouses({
      region,
      village,
      amenity,
    });

    return NextResponse.json({
      success: true,
      teahouses,
      count: teahouses.length,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching teahouses:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve authentic teahouses from database' },
      { status: 500 }
    );
  }
}
