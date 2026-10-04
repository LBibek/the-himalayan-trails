import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getTrailById, getTrailBySlug, getAllItineraries } from '@/lib/db';
import { calculateBookingBreakdown, createCheckoutSessionToken } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      trailId,
      fullName,
      email,
      phone,
      startDate,
      travelers,
      paymentOption,
      specialRequests,
      emergencyContact,
      basePricePerPerson: inputBasePrice
    } = body;

    // Validate required fields
    if (!trailId || typeof trailId !== 'string') {
      return NextResponse.json({ error: 'Valid Trail ID or slug is required' }, { status: 400 });
    }

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json({ error: 'Valid Adventurer full name is required' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid contact email address is required' }, { status: 400 });
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 5) {
      return NextResponse.json({ error: 'Valid emergency phone or WhatsApp number is required' }, { status: 400 });
    }

    if (!startDate || typeof startDate !== 'string') {
      return NextResponse.json({ error: 'Expedition departure start date is required' }, { status: 400 });
    }

    const numTravelers = Number(travelers);
    if (!numTravelers || isNaN(numTravelers) || numTravelers < 1 || numTravelers > 30) {
      return NextResponse.json({ error: 'Travelers count must be between 1 and 30' }, { status: 400 });
    }

    // Lookup trail in real database
    const trail = getTrailById(trailId) || getTrailBySlug(trailId);
    if (!trail) {
      return NextResponse.json({ error: `Trail with ID or slug '${trailId}' not found in database` }, { status: 404 });
    }

    // Determine base package price per person
    let basePricePerPerson = Number(inputBasePrice);
    if (!basePricePerPerson || isNaN(basePricePerPerson) || basePricePerPerson <= 0) {
      // Check itineraries catalog for this trail
      const itineraries = getAllItineraries();
      const matchedItinerary = itineraries.find(
        (it) => it.trailName && it.trailName.toLowerCase() === trail.name.toLowerCase()
      );
      basePricePerPerson = matchedItinerary?.estimatedCostUSD || 850;
    }

    // Calculate full itemized breakdown
    const breakdown = calculateBookingBreakdown({
      basePricePerPerson,
      travelers: numTravelers,
      paymentOption: paymentOption === 'DEPOSIT' ? 'DEPOSIT' : 'FULL'
    });

    // Generate secure session ID and cryptographic token
    const sessionId = `cs_${Date.now()}_${randomBytes(8).toString('hex')}`;
    const expiresAt = Date.now() + 3600 * 1000; // 1 hour validity

    const sessionToken = createCheckoutSessionToken({
      sessionId,
      trailId: trail.id,
      trailName: trail.name,
      travelers: numTravelers,
      startDate: startDate.trim(),
      paymentOption: breakdown.paymentOption,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      emergencyContact: emergencyContact ? emergencyContact.trim() : undefined,
      specialRequests: specialRequests ? specialRequests.trim() : undefined,
      breakdown,
      expiresAt
    });

    return NextResponse.json({
      success: true,
      sessionId,
      sessionToken,
      expiresAt,
      trail: {
        id: trail.id,
        slug: trail.slug,
        name: trail.name,
        region: trail.region,
        durationDays: trail.durationDays,
        maxElevation: trail.maxElevation
      },
      breakdown
    }, { status: 200 });

  } catch (error) {
    console.error('Error generating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error generating checkout session' },
      { status: 500 }
    );
  }
}
