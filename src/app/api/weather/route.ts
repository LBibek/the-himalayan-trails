import { NextRequest, NextResponse } from 'next/server';
import { getWeatherReport } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || undefined;

    const weather = getWeatherReport(region);
    return NextResponse.json(weather, { status: 200 });
  } catch (error) {
    console.error('Error fetching weather:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve weather reports from database' },
      { status: 500 }
    );
  }
}
