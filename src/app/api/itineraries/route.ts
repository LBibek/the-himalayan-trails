import { NextResponse } from 'next/server';
import { getAllItineraries } from '@/lib/db';

export async function GET() {
  try {
    const itineraries = getAllItineraries();
    return NextResponse.json(itineraries, { status: 200 });
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve itineraries from database' },
      { status: 500 }
    );
  }
}
