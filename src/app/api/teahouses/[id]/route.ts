import { NextRequest, NextResponse } from 'next/server';
import { getTeahouseById } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Valid Teahouse ID is required' },
        { status: 400 }
      );
    }

    const teahouse = getTeahouseById(id);
    if (!teahouse) {
      return NextResponse.json(
        { error: `Teahouse '${id}' not found in registry` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      teahouse,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching teahouse details:', error);
    return NextResponse.json(
      { error: 'Internal server error retrieving teahouse details' },
      { status: 500 }
    );
  }
}
