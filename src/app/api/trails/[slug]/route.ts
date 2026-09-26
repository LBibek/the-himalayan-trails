import { NextRequest, NextResponse } from 'next/server';
import { getTrailBySlug } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const trail = getTrailBySlug(slug);

    if (!trail) {
      return NextResponse.json({ error: 'Trail not found' }, { status: 404 });
    }

    return NextResponse.json(trail, { status: 200 });
  } catch (error) {
    console.error('Error fetching trail by slug:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve trail from database' },
      { status: 500 }
    );
  }
}
