import { NextRequest, NextResponse } from 'next/server';
import { getGroupExpeditionByToken, voteGroupSideTrip } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: 'Valid expedition share token is required' }, { status: 400 });
    }

    const expedition = getGroupExpeditionByToken(token.trim());
    if (!expedition) {
      return NextResponse.json(
        { error: `Group expedition '${token}' not found` },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { memberId, sideTripId, sideTripName } = body;

    if (!memberId || typeof memberId !== 'string') {
      return NextResponse.json({ error: 'Member ID is required to cast vote' }, { status: 400 });
    }

    const targetSideTrip = (sideTripName || sideTripId || '').trim();
    if (!targetSideTrip) {
      return NextResponse.json({ error: 'Valid side-trip identifier or name is required' }, { status: 400 });
    }

    const voteResult = voteGroupSideTrip(memberId, targetSideTrip);
    const refreshedExpedition = getGroupExpeditionByToken(expedition.shareToken);

    return NextResponse.json({
      success: true,
      memberId: voteResult.memberId,
      sideTripVotes: voteResult.sideTripVotes,
      sideTripTallies: refreshedExpedition?.sideTripTallies || [],
      expedition: refreshedExpedition
    }, { status: 200 });
  } catch (err: any) {
    console.error('Error submitting side-trip vote:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error recording vote' },
      { status: 500 }
    );
  }
}
