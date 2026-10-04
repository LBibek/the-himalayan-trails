import { NextRequest, NextResponse } from 'next/server';
import { calculatePorterLogistics } from '@/lib/pricing';
import type { PorterCalculationRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: PorterCalculationRequest & { customPorterCount?: number } = await request.json().catch(() => ({ groupSize: 1, durationDays: 1 }));

    // Calculate porter load logistics and fair compensation
    const result = calculatePorterLogistics(body);

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 200 });

  } catch (error) {
    console.error('Error calculating porter logistics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate porter load logistics and fair compensation' },
      { status: 500 }
    );
  }
}
