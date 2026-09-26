import { NextRequest, NextResponse } from 'next/server';
import { getTrailBySlug, updateTrail, deleteTrail } from '@/lib/db';

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const updated = updateTrail(slug, body);
    if (!updated) {
      return NextResponse.json({ error: 'Trail not found or update failed' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error updating trail:', error);
    return NextResponse.json(
      { error: 'Failed to update trail in database' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const success = deleteTrail(slug);

    if (!success) {
      return NextResponse.json({ error: 'Trail not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: `Trail ${slug} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error('Error deleting trail:', error);
    return NextResponse.json(
      { error: 'Failed to delete trail from database' },
      { status: 500 }
    );
  }
}
