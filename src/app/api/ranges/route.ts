import { NextRequest, NextResponse } from 'next/server';
import { getAllRanges } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const ranges = getAllRanges();
    return NextResponse.json(ranges, { status: 200 });
  } catch (error) {
    console.error('Error fetching ranges from database:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve ranges from database' },
      { status: 500 }
    );
  }
}
