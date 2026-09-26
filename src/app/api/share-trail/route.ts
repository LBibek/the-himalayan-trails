import { NextRequest, NextResponse } from 'next/server';
import { createSharedTrail, getSharedTrails } from '@/lib/db';

export async function GET() {
  try {
    const trails = getSharedTrails();
    return NextResponse.json(trails, { status: 200 });
  } catch (error) {
    console.error('Error fetching shared trails:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shared trails from database' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, region, elevation, difficulty, distance, duration, description, creatorName, creatorEmail } = body;

    if (!title || !region || !elevation || !difficulty || !distance || !duration || !creatorName || !creatorEmail) {
      return NextResponse.json(
        { error: 'All fields are required to submit a community trail' },
        { status: 400 }
      );
    }

    const trail = createSharedTrail({
      title: title.trim(),
      region: region.trim(),
      elevation: Number(elevation),
      difficulty: difficulty.trim(),
      distance: distance.trim(),
      duration: duration.trim(),
      description: (description || '').trim(),
      creatorName: creatorName.trim(),
      creatorEmail: creatorEmail.trim().toLowerCase()
    });

    return NextResponse.json(
      { message: 'Trail contribution submitted and stored in database', trail },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving shared trail:', error);
    return NextResponse.json(
      { error: 'Failed to store shared trail in database' },
      { status: 500 }
    );
  }
}
