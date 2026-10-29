import { NextRequest, NextResponse } from 'next/server';
import {
  createOrUpdateGearManifest,
  getGearManifestById,
  getGearManifestsByExpeditionId,
  getGearManifestsByEmail,
  getAllGearManifests
} from '@/lib/db';
import { assessPorterEthicsAndSafety } from '@/lib/porterEthics';
import { ManifestItemEntry } from '@/types/gear';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const expeditionId = searchParams.get('expeditionId');
    const email = searchParams.get('email');
    const evaluate = searchParams.get('evaluate');

    // If requested direct on-the-fly assessment
    if (evaluate === 'true') {
      const daypackKg = parseFloat(searchParams.get('daypack') || '0');
      const duffelKg = parseFloat(searchParams.get('duffel') || '0');
      const bodyWeightKg = parseFloat(searchParams.get('bodyWeight') || '70');
      const groupSize = parseInt(searchParams.get('groupSize') || '1', 10);
      const altitudeM = parseInt(searchParams.get('altitude') || '4500', 10);

      const assessment = assessPorterEthicsAndSafety({
        daypackWeightKg: daypackKg,
        duffelWeightKg: duffelKg,
        trekkerBodyWeightKg: bodyWeightKg,
        groupSize,
        targetAltitudeMeters: altitudeM
      });

      return NextResponse.json({ success: true, assessment }, { status: 200 });
    }

    // Lookup single by ID
    if (id) {
      const manifest = getGearManifestById(id);
      if (!manifest) {
        return NextResponse.json(
          { error: `Gear manifest with ID '${id}' not found` },
          { status: 404 }
        );
      }
      const assessment = assessPorterEthicsAndSafety({
        daypackWeightKg: manifest.daypackWeightKg,
        duffelWeightKg: manifest.duffelWeightKg,
        trekkerBodyWeightKg: manifest.bodyWeightKg,
        groupSize: manifest.groupSize,
        targetAltitudeMeters: manifest.targetAltitudeM
      });
      return NextResponse.json({ success: true, manifest, assessment }, { status: 200 });
    }

    // Lookup by expedition
    if (expeditionId) {
      const manifests = getGearManifestsByExpeditionId(expeditionId);
      return NextResponse.json({ success: true, manifests }, { status: 200 });
    }

    // Lookup by trekker email
    if (email) {
      const manifests = getGearManifestsByEmail(email);
      return NextResponse.json({ success: true, manifests }, { status: 200 });
    }

    // Return all manifests
    const manifests = getAllGearManifests();
    return NextResponse.json({ success: true, manifests }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching gear manifest:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error fetching gear manifests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid JSON request payload' },
        { status: 400 }
      );
    }

    const {
      id,
      expeditionId,
      bookingId,
      trekkerName,
      trekkerEmail,
      bodyWeightKg,
      targetAltitudeM,
      groupSize,
      daypackWeightKg,
      duffelWeightKg,
      items,
      notes
    } = body;

    // Validation
    if (!trekkerName || typeof trekkerName !== 'string' || trekkerName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Field "trekkerName" is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const cleanDaypack = Number(daypackWeightKg);
    const cleanDuffel = Number(duffelWeightKg);

    if (isNaN(cleanDaypack) || cleanDaypack < 0) {
      return NextResponse.json(
        { error: 'Field "daypackWeightKg" must be a non-negative number' },
        { status: 400 }
      );
    }

    if (isNaN(cleanDuffel) || cleanDuffel < 0) {
      return NextResponse.json(
        { error: 'Field "duffelWeightKg" must be a non-negative number' },
        { status: 400 }
      );
    }

    const cleanBodyWeight = Number(bodyWeightKg) > 30 ? Number(bodyWeightKg) : 70.0;
    const cleanAltitude = Number(targetAltitudeM) > 1000 ? Number(targetAltitudeM) : 4500;
    const cleanGroupSize = Math.max(1, Math.floor(Number(groupSize) || 1));

    // Validate items array if provided
    let cleanItems: ManifestItemEntry[] = [];
    if (Array.isArray(items)) {
      cleanItems = items.map((it: any) => ({
        itemId: String(it.itemId || it.id || 'item-custom'),
        name: String(it.name || 'Alpine Item'),
        category: (it.category || 'Alpine Technical Layering') as any,
        weightGrams: Math.max(0, Number(it.weightGrams) || 0),
        carrier: (['daypack', 'duffel', 'worn'].includes(it.carrier) ? it.carrier : 'daypack') as any
      }));
    }

    // Persist to database
    const manifest = createOrUpdateGearManifest({
      id: id ? String(id).trim() : undefined,
      expeditionId: expeditionId ? String(expeditionId).trim() : undefined,
      bookingId: bookingId ? String(bookingId).trim() : undefined,
      trekkerName: trekkerName.trim(),
      trekkerEmail: trekkerEmail ? String(trekkerEmail).trim() : undefined,
      bodyWeightKg: cleanBodyWeight,
      targetAltitudeM: cleanAltitude,
      groupSize: cleanGroupSize,
      daypackWeightKg: cleanDaypack,
      duffelWeightKg: cleanDuffel,
      items: cleanItems,
      notes: notes ? String(notes).trim() : undefined
    });

    // Generate comprehensive ethics assessment
    const assessment = assessPorterEthicsAndSafety({
      daypackWeightKg: manifest.daypackWeightKg,
      duffelWeightKg: manifest.duffelWeightKg,
      trekkerBodyWeightKg: manifest.bodyWeightKg,
      groupSize: manifest.groupSize,
      targetAltitudeMeters: manifest.targetAltitudeM
    });

    const statusCode = id ? 200 : 201;

    return NextResponse.json(
      {
        success: true,
        manifest,
        assessment,
        message: 'Gear manifest saved and evaluated successfully against IPPG standards'
      },
      { status: statusCode }
    );
  } catch (err: any) {
    console.error('Error saving gear manifest:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error saving gear manifest' },
      { status: 500 }
    );
  }
}
