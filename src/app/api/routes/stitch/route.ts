import { NextRequest, NextResponse } from 'next/server';
import { getAllTrails, getTrailBySlug, getTrailById } from '@/lib/db';
import { stitchRoutes, exportStitchedGpx } from '@/lib/routeStitcher';
import type { Trail } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const trailIds: string[] = Array.isArray(body?.trailIds) ? body.trailIds : [];
    const customTitle: string | undefined = body?.customTitle;

    if (trailIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one trail ID or slug must be provided in trailIds array.' },
        { status: 400 }
      );
    }

    const allDbTrails = getAllTrails();
    const selectedTrails: Trail[] = [];

    for (const idOrSlug of trailIds) {
      let match =
        getTrailById(idOrSlug) ||
        getTrailBySlug(idOrSlug) ||
        allDbTrails.find((t) => t.id === idOrSlug || t.slug === idOrSlug);

      if (!match) {
        const { getCanonicalTrailBySlug } = await import('@/lib/canonicalStages');
        const canonical = getCanonicalTrailBySlug(idOrSlug);
        if (canonical) {
          match = {
            id: canonical.slug,
            slug: canonical.slug,
            name: canonical.name,
            region: canonical.region,
            difficulty: 'Challenging',
            distanceKm: canonical.stages.reduce((sum, s) => sum + (s.distanceKm || 10), 0),
            durationDays: canonical.durationDays,
            maxElevation: canonical.maxElevation,
            elevationGain: canonical.stages.reduce((sum, s) => sum + 350, 0),
            image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
            description: `${canonical.name} across ${canonical.region}`,
            highlights: canonical.stages.map((s) => s.title).slice(0, 4),
            bestMonths: ['Mar-May', 'Oct-Nov'],
            startPoint: canonical.stages[0]?.title || 'Trailhead',
            endPoint: canonical.stages[canonical.stages.length - 1]?.title || 'Terminus',
            rating: 4.9,
            reviewsCount: 120,
            elevationProfile: canonical.stages.map((s, idx) => ({
              distanceKm: idx * 10,
              elevation: s.elevation,
              label: s.title
            }))
          };
        }
      }

      if (match) {
        selectedTrails.push(match);
      }
    }

    if (selectedTrails.length === 0) {
      return NextResponse.json(
        { error: 'None of the requested trail IDs were found in the database catalog.' },
        { status: 404 }
      );
    }

    const stitchedRoute = stitchRoutes(selectedTrails, { customTitle });

    const format = request.nextUrl.searchParams.get('format');
    if (format === 'gpx') {
      const gpxContent = exportStitchedGpx(stitchedRoute);
      return new NextResponse(gpxContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/gpx+xml; charset=utf-8',
          'Content-Disposition': `attachment; filename="stitched-${stitchedRoute.id}.gpx"`
        }
      });
    }

    return NextResponse.json(stitchedRoute, { status: 200 });
  } catch (error) {
    console.error('Error in route stitching API:', error);
    return NextResponse.json(
      { error: 'Failed to process multi-trail route stitching' },
      { status: 500 }
    );
  }
}
