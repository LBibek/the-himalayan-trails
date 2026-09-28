import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getDatabase();

    // Resolve trail by id or slug
    const trail = db.prepare('SELECT id, slug FROM trails WHERE id = ? OR slug = ?').get(slug, slug) as { id: string; slug: string } | undefined;
    const trailId = trail ? trail.id : slug;
    const trailSlug = trail ? trail.slug : slug;

    const reviews = db
      .prepare(
        `SELECT r.*,
                COALESCE(r.reviewer_name, u.name, r.user_name, 'Adventurer') as reviewer_name,
                COALESCE(u.name, r.user_name, r.reviewer_name, 'Adventurer') as user_name
         FROM reviews r
         LEFT JOIN users u ON r.user_id = u.id
         WHERE (r.trail_id = ? OR r.trail_id = ?)
         ORDER BY r.created_at DESC
         LIMIT 20`
      )
      .all(trailId, trailSlug);

    // Compute aggregate stats
    const stats = db
      .prepare(
        `SELECT
           COUNT(*) as total,
           ROUND(AVG(r.overall_rating), 1) as avg_rating,
           ROUND(AVG(COALESCE(r.difficulty_rating, r.overall_rating)), 1) as avg_difficulty,
           ROUND(AVG(COALESCE(r.scenery_rating, r.scenic_rating, r.overall_rating)), 1) as avg_scenery,
           ROUND(AVG(COALESCE(r.safety_rating, r.overall_rating)), 1) as avg_safety
         FROM reviews r WHERE (r.trail_id = ? OR r.trail_id = ?)`
      )
      .get(trailId, trailSlug) as { total: number; avg_rating: number; avg_difficulty: number; avg_scenery: number; avg_safety: number } | undefined;

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

    const { reviewer_name, overall_rating, difficulty_rating, scenery_rating, safety_rating, comment, condition_tags, user_id, user_email, photos } = body;

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

    // Resolve trail by id or slug to ensure strict foreign key compliance
    const trail = db.prepare('SELECT id, slug FROM trails WHERE id = ? OR slug = ?').get(slug, slug) as { id: string; slug: string } | undefined;
    const targetTrailId = trail ? trail.id : slug;
    const targetTrailSlug = trail ? trail.slug : slug;

    const trimmedName = reviewer_name.trim();
    const diffVal = Math.round(difficulty_rating || overall_rating);
    const scenVal = Math.round(scenery_rating || overall_rating);
    const safeVal = Math.round(safety_rating || overall_rating);
    const photosJson = photos && Array.isArray(photos) ? JSON.stringify(photos) : null;

    db.prepare(
      `INSERT INTO reviews (
        id, trail_id, user_id, user_name, user_email, reviewer_name,
        overall_rating, difficulty_rating, scenic_rating, scenery_rating,
        safety_rating, comment, condition_tags, photos_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(
      id,
      targetTrailId,
      user_id || null,
      trimmedName,
      user_email || null,
      trimmedName,
      Math.round(overall_rating),
      diffVal,
      scenVal,
      scenVal,
      safeVal,
      comment.trim(),
      condition_tags || '',
      photosJson
    );

    // Update trail aggregate rating
    const agg = db.prepare(
      `SELECT COUNT(*) as cnt, ROUND(AVG(overall_rating), 1) as avg FROM reviews WHERE (trail_id = ? OR trail_id = ?)`
    ).get(targetTrailId, targetTrailSlug) as { cnt: number; avg: number } | undefined;

    if (agg) {
      db.prepare(`UPDATE trails SET rating = ?, reviews_count = ? WHERE id = ? OR slug = ?`).run(
        agg.avg, agg.cnt, targetTrailId, targetTrailSlug
      );
    }

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
