import { NextRequest, NextResponse } from 'next/server';
import { upvoteTrailConditionReport } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Valid Report ID is required' },
        { status: 400 }
      );
    }

    const result = upvoteTrailConditionReport(id);

    return NextResponse.json({
      success: true,
      upvotes: result.upvotes,
      id: result.id,
      message: 'Helpful upvote recorded',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error upvoting trail condition report:', error);
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to record condition report upvote' },
      { status: 500 }
    );
  }
}
