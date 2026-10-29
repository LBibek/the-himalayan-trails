import { NextRequest, NextResponse } from 'next/server';
import {
  createGroupExpedition,
  getAllGroupExpeditions,
  getGroupExpeditionsForUser,
  getTrailById,
  getTrailBySlug
} from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      trailId,
      leaderName,
      leaderEmail,
      expeditionTitle,
      targetStartDate,
      targetGroupSize,
      itineraryCustomization,
      shareToken,
      leaderUserId,
      shareAmountUsd
    } = body;

    // Strict input validation
    if (!trailId || typeof trailId !== 'string') {
      return NextResponse.json({ error: 'Valid Trail ID or slug is required' }, { status: 400 });
    }

    if (!leaderName || typeof leaderName !== 'string' || leaderName.trim().length < 2) {
      return NextResponse.json({ error: 'Expedition leader full name is required' }, { status: 400 });
    }

    if (!leaderEmail || typeof leaderEmail !== 'string' || !leaderEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid expedition leader email address is required' }, { status: 400 });
    }

    if (!expeditionTitle || typeof expeditionTitle !== 'string' || expeditionTitle.trim().length < 3) {
      return NextResponse.json({ error: 'Expedition title is required (minimum 3 characters)' }, { status: 400 });
    }

    if (!targetStartDate || typeof targetStartDate !== 'string') {
      return NextResponse.json({ error: 'Expedition target departure date is required' }, { status: 400 });
    }

    const groupSizeNum = Number(targetGroupSize);
    if (!groupSizeNum || isNaN(groupSizeNum) || groupSizeNum < 2 || groupSizeNum > 20) {
      return NextResponse.json({ error: 'Target group size must be between 2 and 20 adventurers' }, { status: 400 });
    }

    // Verify trail exists in catalog
    const trail = getTrailById(trailId) || getTrailBySlug(trailId);
    if (!trail) {
      return NextResponse.json({ error: `Trail with ID '${trailId}' not found in catalog` }, { status: 404 });
    }

    const expedition = createGroupExpedition({
      trailId: trail.id,
      leaderUserId,
      leaderName: leaderName.trim(),
      leaderEmail: leaderEmail.trim(),
      expeditionTitle: expeditionTitle.trim(),
      targetStartDate,
      targetGroupSize: groupSizeNum,
      itineraryCustomization,
      shareToken,
      shareAmountUsd: Number(shareAmountUsd) || 187.50
    });

    return NextResponse.json({
      success: true,
      expedition,
      shareToken: expedition.shareToken,
      inviteLink: expedition.inviteLink
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating group expedition:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error creating group expedition' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userQuery = searchParams.get('user');

    if (userQuery && userQuery.trim().length > 0) {
      const expeditions = getGroupExpeditionsForUser(userQuery.trim());
      return NextResponse.json({ success: true, expeditions }, { status: 200 });
    }

    const expeditions = getAllGroupExpeditions();
    return NextResponse.json({ success: true, expeditions }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching group expeditions:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error fetching expeditions' },
      { status: 500 }
    );
  }
}
