import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getDatabase();

    const reviews = db
      .prepare(
        `SELECT r.*, u.name as user_name FROM reviews r
         LEFT JOIN users u ON r.user_id = u.id
         WHERE r.trail_id = ?
         ORDER BY r.created_at DESC
         LIMIT 20`
      )
      .all(slug);

    // Compute aggregate stats
    const stats = db
      .prepare(
        `SELECT
           COUNT(*) as total,
           ROUND(AVG(r.overall_rating), 1) as avg_rating,
           ROUND(AVG(r.difficulty_rating), 1) as avg_difficulty,
           ROUND(AVG(r.scenery_rating), 1) as avg_scenery,
           ROUND(AVG(r.safety_rating), 1) as avg_safety
         FROM reviews r WHERE r.trail_id = ?`
      )
      .get(slug) as { total: number; avg_rating: number; avg_difficulty: number; avg_scenery: number; avg_safety: number } | undefined;

    return NextResponse.json({
      reviews,
      stats: stats || { total: 0, avg_rating: 0, avg_difficulty: 0, avg_scenery: 0, avg_safety: 0 },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ reviews: [], stats: { total: 0, avg_rating: 0 } });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const { reviewer_name, overall_rating, difficulty_rating, scenery_rating, safety_rating, comment, condition_tags } = body;

    if (!reviewer_name || typeof reviewer_name !== 'string' || reviewer_name.trim().length < 2) {
      return NextResponse.json({ error: 'Name is required (min 2 characters)' }, { status: 400 });
    }
    if (!overall_rating || overall_rating < 1 || overall_rating > 5) {
      return NextResponse.json({ error: 'Overall rating must be 1-5' }, { status: 400 });
    }
    if (!comment || typeof comment !== 'string' || comment.trim().length < 5) {
      return NextResponse.json({ error: 'Comment must be at least 5 characters' }, { status: 400 });
    }

    const db = getDatabase();
    const id = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    db.prepare(
      `INSERT INTO reviews (id, trail_id, reviewer_name, overall_rating, difficulty_rating, scenery_rating, safety_rating, comment, condition_tags, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(
      id,
      slug,
      reviewer_name.trim(),
      Math.round(overall_rating),
      Math.round(difficulty_rating || overall_rating),
      Math.round(scenery_rating || overall_rating),
      Math.round(safety_rating || overall_rating),
      comment.trim(),
      condition_tags || ''
    );

    // Update trail aggregate rating
    const agg = db.prepare(
      `SELECT COUNT(*) as cnt, ROUND(AVG(overall_rating), 1) as avg FROM reviews WHERE trail_id = ?`
    ).get(slug) as { cnt: number; avg: number } | undefined;

    if (agg) {
      db.prepare(`UPDATE trails SET rating = ?, reviews_count = ? WHERE id = ? OR slug = ?`).run(
        agg.avg, agg.cnt, slug, slug
      );
    }

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
