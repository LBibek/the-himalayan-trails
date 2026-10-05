import { NextRequest, NextResponse } from 'next/server';
import {
  getAllPassCrossingAssessments,
  evaluatePassCrossingWindow,
  HIGH_PASS_CROSSING_REGISTRY
} from '@/lib/passCrossingWindow';
import { getWeatherReports } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const passId = searchParams.get('passId') || searchParams.get('id');

    let baseReports;
    try {
      baseReports = getWeatherReports();
    } catch {
      // Database cold start fallback
    }

    if (passId) {
      const assessment = evaluatePassCrossingWindow(passId, baseReports);
      if (!assessment) {
        return NextResponse.json(
          {
            error: `Pass '${passId}' not found. Available passes: ${HIGH_PASS_CROSSING_REGISTRY.map((p) => p.id).join(', ')}`
          },
          { status: 404 }
        );
      }
      return NextResponse.json(assessment, { status: 200 });
    }

    const allAssessments = getAllPassCrossingAssessments(baseReports);
    return NextResponse.json(allAssessments, { status: 200 });
  } catch (error) {
    console.error('Error fetching high pass crossing windows:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve high-pass alpine crossing window assessments' },
      { status: 500 }
    );
  }
}
