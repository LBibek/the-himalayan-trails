import { NextRequest, NextResponse } from 'next/server';
import { getGuideById } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Valid Guide ID or license number is required' },
        { status: 400 }
      );
    }

    const guide = getGuideById(id);
    if (!guide) {
      return NextResponse.json(
        { error: `Sherpa Guide '${id}' not found in certified registry` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      guide
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching guide profile:', error);
    return NextResponse.json(
      { error: 'Internal server error retrieving guide profile' },
      { status: 500 }
    );
  }
}
