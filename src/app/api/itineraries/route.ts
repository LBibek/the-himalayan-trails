import { NextRequest, NextResponse } from 'next/server';
import { getAllItineraries, createItinerary } from '@/lib/db';
import { ItineraryDay } from '@/types';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      trailName,
      author,
      authorAvatar,
      totalDays,
      maxAltitude,
      difficulty,
      estimatedCostUSD,
      days
    } = body;

    if (!title || !trailName || !days || !Array.isArray(days) || days.length === 0) {
      return NextResponse.json(
        { error: 'Title, trailName, and at least one day waypoint are required.' },
        { status: 400 }
      );
    }

    const calculatedMaxAltitude = maxAltitude || Math.max(...days.map((d: ItineraryDay) => d.sleepingAltitude || 0), 2000);
    const calculatedTotalDays = totalDays || days.length;
    const calculatedCost = estimatedCostUSD ?? (calculatedTotalDays * 85);

    const savedItinerary = createItinerary({
      title: title.trim(),
      trailName: trailName.trim(),
      author: (author || 'Expedition Planner').trim(),
      authorAvatar,
      totalDays: Number(calculatedTotalDays),
      maxAltitude: Number(calculatedMaxAltitude),
      difficulty: difficulty || 'Moderate',
      estimatedCostUSD: Number(calculatedCost),
      days
    });

    return NextResponse.json(savedItinerary, { status: 201 });
  } catch (error) {
    console.error('Error saving itinerary to database:', error);
    return NextResponse.json(
      { error: 'Failed to persist itinerary to database' },
      { status: 500 }
    );
  }
}
