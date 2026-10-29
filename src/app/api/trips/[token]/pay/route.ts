import { NextRequest, NextResponse } from 'next/server';
import { getGroupExpeditionByToken, processGroupMemberPayment } from '@/lib/db';

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
      memberId,
      paymentMethod,
      cardLast4,
      amountUsd
    } = body;

    if (!memberId || typeof memberId !== 'string') {
      return NextResponse.json({ error: 'Valid group member ID is required for checkout' }, { status: 400 });
    }

    // Verify member belongs to this expedition
    const member = expedition.members.find((m) => m.id === memberId);
    if (!member) {
      return NextResponse.json(
        { error: `Member with ID '${memberId}' does not belong to expedition '${token}'` },
        { status: 400 }
      );
    }

    if (member.paymentStatus !== 'UNPAID') {
      return NextResponse.json(
        {
          error: `Member '${member.memberName}' has already completed their deposit payment (${member.receiptNumber})`,
          receiptNumber: member.receiptNumber,
          alreadyPaid: true
        },
        { status: 409 }
      );
    }

    // Process ACID SQLite payment transaction
    const paymentResult = processGroupMemberPayment(memberId, {
      paymentMethod: paymentMethod || 'CREDIT_CARD',
      cardLast4: cardLast4 || '4242',
      amountUsd: typeof amountUsd === 'number' ? amountUsd : member.shareAmountUsd
    });

    const refreshedExpedition = getGroupExpeditionByToken(expedition.shareToken);
    const updatedMember = refreshedExpedition?.members.find((m) => m.id === memberId);

    return NextResponse.json({
      success: true,
      receiptNumber: paymentResult.receiptNumber,
      paidAt: paymentResult.paidAt,
      amountPaid: paymentResult.amountPaid,
      paidMembersCount: paymentResult.paidMembersCount,
      targetGroupSize: paymentResult.targetGroupSize,
      progressRatio: paymentResult.paidMembersCount / paymentResult.targetGroupSize,
      progressLabel: `${paymentResult.paidMembersCount} of ${paymentResult.targetGroupSize} team members paid`,
      expeditionStatus: paymentResult.expeditionStatus,
      member: updatedMember,
      expedition: refreshedExpedition
    }, { status: 200 });
  } catch (err: any) {
    console.error('Error processing group split deposit payment:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error processing split deposit' },
      { status: 500 }
    );
  }
}
