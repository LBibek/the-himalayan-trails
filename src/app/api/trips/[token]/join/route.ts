import { NextRequest, NextResponse } from 'next/server';
import { getGroupExpeditionByToken, joinGroupExpedition } from '@/lib/db';

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
    const {
      memberName,
      memberEmail,
      sideTripVotes,
      personalGearRentals,
      shareAmountUsd
    } = body;

    if (!memberName || typeof memberName !== 'string' || memberName.trim().length < 2) {
      return NextResponse.json({ error: 'Valid adventurer full name is required' }, { status: 400 });
    }

    if (!memberEmail || typeof memberEmail !== 'string' || !memberEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const member = joinGroupExpedition(expedition.id, {
      memberName: memberName.trim(),
      memberEmail: memberEmail.trim(),
      sideTripVotes: Array.isArray(sideTripVotes) ? sideTripVotes : [],
      personalGearRentals: Array.isArray(personalGearRentals) ? personalGearRentals : [],
      shareAmountUsd: Number(shareAmountUsd) || expedition.depositPerPersonUsd || 187.50
    });

    const refreshedExpedition = getGroupExpeditionByToken(expedition.shareToken);

    return NextResponse.json({
      success: true,
      member,
      expedition: refreshedExpedition
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error joining group expedition:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error joining group expedition' },
      { status: 500 }
    );
  }
}
