import { NextRequest, NextResponse } from 'next/server';
import { getTrailConditionReports, createTrailConditionReport, getTrailById } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trailId = searchParams.get('trailId') || undefined;
    const statusLevel = searchParams.get('statusLevel') || undefined;

    const reports = getTrailConditionReports({
      trailId,
      statusLevel,
    });

    return NextResponse.json({
      success: true,
      reports,
      count: reports.length,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching trail condition reports:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve trail condition reports from database' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      trailId,
      reporterName,
      reporterRole,
      statusLevel,
      conditionType,
      latitude,
      longitude,
      locationName,
      elevation,
      notes,
      gearRecommended,
    } = body;

    if (!trailId || !reporterName || !reporterRole || !statusLevel || !conditionType || !locationName || !notes) {
      return NextResponse.json(
        { error: 'Missing required report fields: trailId, reporterName, reporterRole, statusLevel, conditionType, locationName, and notes are required' },
        { status: 400 }
      );
    }

    const VALID_ROLES = ['Certified Sherpa Guide', 'Verified Adventurer', 'Lodge Host'];
    const VALID_STATUSES = ['CLEAR_PASSABLE', 'CAUTION_HAZARD', 'BLOCKED_IMPASSABLE'];
    const VALID_CONDITION_TYPES = [
      'Snow / Ice on Pass',
      'River Crossing / Bridge',
      'Landslide / Rockfall',
      'Weather Window',
      'Teahouse Capacity Full',
    ];

    if (!VALID_ROLES.includes(reporterRole.trim())) {
      return NextResponse.json(
        { error: `Invalid reporterRole: must be one of ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }
    if (!VALID_STATUSES.includes(statusLevel.trim())) {
      return NextResponse.json(
        { error: `Invalid statusLevel: must be one of ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    if (!VALID_CONDITION_TYPES.includes(conditionType.trim())) {
      return NextResponse.json(
        { error: `Invalid conditionType: must be one of ${VALID_CONDITION_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const trail = getTrailById(trailId.trim());
    if (!trail) {
      return NextResponse.json(
        { error: `Trail with ID '${trailId}' not found in registry` },
        { status: 404 }
      );
    }

    const parsedLat = Number(latitude) || 0;
    const parsedLng = Number(longitude) || 0;
    const parsedElevation = Number(elevation) || 0;

    const report = createTrailConditionReport({
      trailId,
      reporterName: reporterName.trim(),
      reporterRole: reporterRole.trim(),
      statusLevel: statusLevel.trim(),
      conditionType: conditionType.trim(),
      latitude: parsedLat,
      longitude: parsedLng,
      locationName: locationName.trim(),
      elevation: parsedElevation,
      notes: notes.trim(),
      gearRecommended: gearRecommended ? gearRecommended.trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      report,
      message: 'Field condition report verified and published',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating trail condition report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit trail condition report' },
      { status: 500 }
    );
  }
}
