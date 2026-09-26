import { NextRequest, NextResponse } from 'next/server';
import { getAllStories, getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const stories = getAllStories();
    return NextResponse.json(stories, { status: 200 });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve stories from database' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subtitle, author, authorRole, region, trailName, content, coverImage } = body;

    if (!title || !author || !content) {
      return NextResponse.json(
        { error: 'Title, author, and content are required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const id = `story_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const readTime = `${Math.max(2, Math.ceil(content.split(' ').length / 150))} min read`;

    db.prepare(`
      INSERT INTO stories (
        id, title, subtitle, author, author_avatar, author_role, region,
        trail_name, read_time, date, cover_image, content, likes, comments, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
    `).run(
      id,
      title.trim(),
      (subtitle || '').trim(),
      author.trim(),
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      (authorRole || 'Himalayan Explorer').trim(),
      (region || 'Everest').trim(),
      (trailName || 'Himalayan High Route').trim(),
      readTime,
      dateFormatted,
      coverImage || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      content.trim(),
      now.toISOString()
    );

    const created = {
      id,
      title,
      subtitle: subtitle || '',
      author,
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      authorRole: authorRole || 'Himalayan Explorer',
      region: region || 'Everest',
      trailName: trailName || 'Himalayan High Route',
      readTime,
      date: dateFormatted,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      content,
      likes: 0,
      comments: 0
    };

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json(
      { error: 'Failed to record story in database' },
      { status: 500 }
    );
  }
}
