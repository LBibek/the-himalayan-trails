import { NextRequest, NextResponse } from 'next/server';
import { getAllTrails, createTrail } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const region = searchParams.get('region') || undefined;
    const difficulty = searchParams.get('difficulty') || undefined;
    const maxElevationParam = searchParams.get('maxElevation');
    const maxElevation = maxElevationParam ? parseInt(maxElevationParam, 10) : undefined;

    const trails = getAllTrails({
      search,
      region,
      difficulty,
      maxElevation
    });

    return NextResponse.json(trails, { status: 200 });
  } catch (error) {
    console.error('Error fetching trails:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve trails from persistent database' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.region || !body.difficulty || !body.distanceKm) {
      return NextResponse.json(
        { error: 'Missing required trail fields (name, region, difficulty, distanceKm)' },
        { status: 400 }
      );
    }

    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const id = body.id || `trail_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newTrail = createTrail({
      id,
      slug,
      name: body.name,
      region: body.region,
      difficulty: body.difficulty,
      distanceKm: Number(body.distanceKm),
      durationDays: Number(body.durationDays || 7),
      maxElevation: Number(body.maxElevation || 4000),
      elevationGain: Number(body.elevationGain || 2500),
      image: body.image || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      description: body.description || '',
      highlights: Array.isArray(body.highlights) ? body.highlights : [],
      bestMonths: Array.isArray(body.bestMonths) ? body.bestMonths : ['Mar-May', 'Oct-Nov'],
      startPoint: body.startPoint || 'Kathmandu',
      endPoint: body.endPoint || 'Kathmandu',
      elevationProfile: body.elevationProfile,
      routeCoordinates: body.routeCoordinates
    });

    return NextResponse.json(newTrail, { status: 201 });
  } catch (error) {
    console.error('Error creating trail:', error);
    return NextResponse.json(
      { error: 'Failed to create trail in database' },
      { status: 500 }
    );
  }
}
