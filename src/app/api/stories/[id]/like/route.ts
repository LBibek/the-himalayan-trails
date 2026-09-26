import { NextRequest, NextResponse } from 'next/server';
import { likeStory } from '@/lib/db';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const likes = likeStory(id);
    return NextResponse.json({ success: true, likes }, { status: 200 });
  } catch (error) {
    console.error('Error liking story:', error);
    return NextResponse.json(
      { error: 'Failed to update story likes in database' },
      { status: 500 }
    );
  }
}
