import { NextRequest, NextResponse } from 'next/server';
import { getAllLandmarks } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const region = searchParams.get('region') || undefined;
    const trail = searchParams.get('trail') || searchParams.get('trailId') || undefined;

    const landmarks = getAllLandmarks(category, region, trail);
    return NextResponse.json(landmarks, { status: 200 });
  } catch (error) {
    console.error('Error fetching landmarks:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve landmarks from database' },
      { status: 500 }
    );
  }
}
