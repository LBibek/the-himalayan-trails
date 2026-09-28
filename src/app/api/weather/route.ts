import { NextRequest, NextResponse } from 'next/server';
import { getWeatherReport, getWeatherReports } from '@/lib/db';
import {
  calculateFreezingLevel,
  calculateWindChill,
  getHighPassesHazardTelemetry,
  getWeatherRadarTileConfig,
  fetchLiveWeatherRadarTileConfig,
} from '@/lib/weatherPhysics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawRegion = searchParams.get('region');
    const region = (!rawRegion || rawRegion.toLowerCase() === 'all') ? undefined : rawRegion;

    const weather = getWeatherReport(region);
    const allReports = getWeatherReports();
    const freezingLevelAltitudeMeters = calculateFreezingLevel(weather.elevation, weather.tempC);
    const windChillC = calculateWindChill(weather.tempC, weather.windKm);
    const highPasses = getHighPassesHazardTelemetry(allReports.length > 0 ? allReports : weather);
    const radar = await fetchLiveWeatherRadarTileConfig();

    return NextResponse.json(
      {
        ...weather,
        freezingLevelAltitudeMeters,
        windChillC,
        highPasses,
        radar,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching weather:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve weather reports from database' },
      { status: 500 }
    );
  }
}
