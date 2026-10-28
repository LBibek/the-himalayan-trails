import { NextRequest, NextResponse } from 'next/server';
import { getAllTrails } from '@/lib/db';
import { matchExpeditions, calculateTrueCost } from '@/lib/matchmaker';
import { MatchmakerPreferences } from '@/types/matchmaker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Validate inputs with safe defaults
    const preferences: MatchmakerPreferences = {
      duration: ['short', 'medium', 'long'].includes(body.duration) ? body.duration : 'medium',
      season: ['spring', 'autumn', 'winter', 'monsoon'].includes(body.season) ? body.season : 'autumn',
      fitness: ['casual', 'intermediate', 'extreme'].includes(body.fitness) ? body.fitness : 'intermediate',
      vibe: ['classic_iconic', 'remote_wilderness', 'cultural_immersion'].includes(body.vibe) ? body.vibe : 'classic_iconic',
      comfort: ['authentic_teahouse', 'premium_lodge'].includes(body.comfort) ? body.comfort : 'authentic_teahouse'
    };

    const trails = getAllTrails();
    const matches = matchExpeditions(trails, preferences);

    return NextResponse.json({
      success: true,
      preferences,
      count: matches.length,
      matches
    }, { status: 200 });
  } catch (error) {
    console.error('Error in matchmaker API:', error);
    return NextResponse.json({ error: 'Internal server error evaluating expedition match' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const durationParam = searchParams.get('duration') as any;
    const seasonParam = searchParams.get('season') as any;
    const fitnessParam = searchParams.get('fitness') as any;
    const vibeParam = searchParams.get('vibe') as any;
    const comfortParam = searchParams.get('comfort') as any;

    const preferences: MatchmakerPreferences = {
      duration: ['short', 'medium', 'long'].includes(durationParam) ? durationParam : 'medium',
      season: ['spring', 'autumn', 'winter', 'monsoon'].includes(seasonParam) ? seasonParam : 'autumn',
      fitness: ['casual', 'intermediate', 'extreme'].includes(fitnessParam) ? fitnessParam : 'intermediate',
      vibe: ['classic_iconic', 'remote_wilderness', 'cultural_immersion'].includes(vibeParam) ? vibeParam : 'classic_iconic',
      comfort: ['authentic_teahouse', 'premium_lodge'].includes(comfortParam) ? comfortParam : 'authentic_teahouse'
    };

    const trails = getAllTrails();
    const matches = matchExpeditions(trails, preferences);

    return NextResponse.json({
      success: true,
      preferences,
      count: matches.length,
      matches
    }, { status: 200 });
  } catch (error) {
    console.error('Error in matchmaker GET API:', error);
    return NextResponse.json({ error: 'Internal server error calculating matches' }, { status: 500 });
  }
}
