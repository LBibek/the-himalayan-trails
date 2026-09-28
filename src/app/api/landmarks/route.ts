import { NextRequest, NextResponse } from 'next/server';
import {
  getAllLandmarks,
  getLandmarkById,
  createLandmark,
  updateLandmark,
  deleteLandmark,
} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const region = searchParams.get('region') || undefined;
    const trail = searchParams.get('trail') || searchParams.get('trailId') || undefined;
    const id = searchParams.get('id') || undefined;

    if (id) {
      const landmark = getLandmarkById(id);
      if (!landmark) {
        return NextResponse.json({ error: 'Landmark not found' }, { status: 404 });
      }
      return NextResponse.json(landmark, { status: 200 });
    }

    const landmarks = getAllLandmarks(category, region, trail);
    return NextResponse.json(landmarks, { status: 200 });
  } catch (error) {
    console.error('Error fetching landmarks:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve landmarks from database' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      nativeName,
      category,
      elevation,
      region,
      coordinates,
      image,
      description,
      permitRequired,
      associatedTrail,
    } = body;

    // Strict validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Landmark name is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { error: 'Valid landmark category is required' },
        { status: 400 }
      );
    }

    if (typeof elevation !== 'number' || isNaN(elevation)) {
      return NextResponse.json(
        { error: 'Valid numerical elevation in meters is required' },
        { status: 400 }
      );
    }

    if (!region || typeof region !== 'string') {
      return NextResponse.json(
        { error: 'Region is required' },
        { status: 400 }
      );
    }

    if (
      !coordinates ||
      typeof coordinates.lat !== 'number' ||
      typeof coordinates.lng !== 'number' ||
      isNaN(coordinates.lat) ||
      isNaN(coordinates.lng)
    ) {
      return NextResponse.json(
        { error: 'Valid coordinates (lat, lng) are required' },
        { status: 400 }
      );
    }

    // Latitude & Longitude bounds check for Himalayan region
    if (coordinates.lat < 25 || coordinates.lat > 32 || coordinates.lng < 78 || coordinates.lng > 92) {
      return NextResponse.json(
        { error: 'Coordinates are outside the expected Himalayan corridor (Lat 25°-32°, Lng 78°-92°)' },
        { status: 400 }
      );
    }

    const newLandmark = createLandmark({
      name: name.trim(),
      nativeName: nativeName?.trim() || undefined,
      category,
      elevation: Math.round(elevation),
      region,
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng,
      },
      image: image?.trim() || undefined,
      description: description?.trim() || `${name.trim()} landmark situated in the ${region} region.`,
      permitRequired: permitRequired?.trim() || 'None',
      associatedTrail: associatedTrail?.trim() || 'All Trails',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Landmark created successfully in persistent database',
        landmark: newLandmark,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating landmark:', error);
    return NextResponse.json(
      { error: 'Failed to create landmark in database' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Landmark ID query parameter is required for deletion' },
        { status: 400 }
      );
    }

    const success = deleteLandmark(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Landmark not found or could not be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Landmark ${id} deleted successfully from database`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting landmark:', error);
    return NextResponse.json(
      { error: 'Failed to delete landmark from database' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Landmark ID is required for updating' },
        { status: 400 }
      );
    }

    const updated = updateLandmark(id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: 'Landmark not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Landmark updated successfully',
        landmark: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating landmark:', error);
    return NextResponse.json(
      { error: 'Failed to update landmark in database' },
      { status: 500 }
    );
  }
}
