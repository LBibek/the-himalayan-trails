-- =========================================================
-- The Himalayan Trails: Comprehensive Supabase Schema & Security Setup
-- =========================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'TREKKER' CHECK (role IN ('ADMIN', 'GUIDE', 'TREKKER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TRAILS TABLE
CREATE TABLE IF NOT EXISTS public.trails (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    distance_km NUMERIC NOT NULL,
    duration_days INTEGER NOT NULL,
    max_elevation INTEGER NOT NULL,
    elevation_gain INTEGER NOT NULL,
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    highlights JSONB DEFAULT '[]'::jsonb,
    best_months JSONB DEFAULT '[]'::jsonb,
    start_point TEXT NOT NULL,
    end_point TEXT NOT NULL,
    rating NUMERIC DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    elevation_profile JSONB DEFAULT '[]'::jsonb,
    route_coordinates JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. LANDMARKS TABLE
CREATE TABLE IF NOT EXISTS public.landmarks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    native_name TEXT,
    category TEXT NOT NULL,
    elevation INTEGER NOT NULL,
    region TEXT NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    permit_required TEXT NOT NULL,
    associated_trail TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. RANGES TABLE
CREATE TABLE IF NOT EXISTS public.ranges (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    center_lat NUMERIC NOT NULL,
    center_lng NUMERIC NOT NULL,
    bounds_json JSONB DEFAULT '[]'::jsonb,
    pois_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ITINERARIES TABLE
CREATE TABLE IF NOT EXISTS public.itineraries (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    trail_name TEXT NOT NULL,
    author TEXT NOT NULL,
    author_avatar TEXT NOT NULL,
    total_days INTEGER NOT NULL,
    max_altitude INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    estimated_cost_usd NUMERIC NOT NULL,
    likes INTEGER DEFAULT 0,
    clones INTEGER DEFAULT 0,
    days_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. STORIES TABLE
CREATE TABLE IF NOT EXISTS public.stories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    author TEXT NOT NULL,
    author_avatar TEXT NOT NULL,
    author_role TEXT NOT NULL,
    region TEXT NOT NULL,
    trail_name TEXT NOT NULL,
    read_time TEXT NOT NULL,
    date TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. STORY COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.story_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id TEXT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. WEATHER REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.weather_reports (
    id TEXT PRIMARY KEY,
    location TEXT NOT NULL,
    region TEXT NOT NULL,
    elevation INTEGER NOT NULL,
    temp_c INTEGER NOT NULL,
    feels_like_c INTEGER NOT NULL,
    wind_km INTEGER NOT NULL,
    condition TEXT NOT NULL,
    avalanche_risk TEXT NOT NULL,
    hazards_json JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    trail_id TEXT NOT NULL REFERENCES public.trails(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    start_date DATE NOT NULL,
    travelers INTEGER NOT NULL DEFAULT 1,
    special_requests TEXT,
    total_price NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'EXPEDITION_ACTIVE', 'COMPLETED', 'CANCELLED', 'PENDING')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. INQUIRIES & TREK CUSTOMIZATION TABLE
CREATE TABLE IF NOT EXISTS public.inquiries (
    id TEXT PRIMARY KEY,
    trail_id TEXT NOT NULL,
    trail_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    group_size INTEGER DEFAULT 1,
    preferred_start_date DATE,
    fitness_level TEXT,
    notes TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CONTACTED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'READ', 'RESPONDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trail_id TEXT NOT NULL REFERENCES public.trails(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    country TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. SHARED TRAILS TABLE
CREATE TABLE IF NOT EXISTS public.shared_trails (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    region TEXT NOT NULL,
    elevation INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    distance TEXT NOT NULL,
    duration TEXT NOT NULL,
    description TEXT NOT NULL,
    creator_name TEXT NOT NULL,
    creator_email TEXT NOT NULL,
    status TEXT DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

-- Enable RLS across all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_trails ENABLE ROW LEVEL SECURITY;

-- 1. Users: Users can read own profile; Authenticated admin can read all
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid()::text = id OR auth.jwt()->>'role' = 'ADMIN');

CREATE POLICY "Anyone can register user account"
    ON public.users FOR INSERT
    WITH CHECK (true);

-- 2. Trails: Public Read Access; Admins can insert/update/delete
CREATE POLICY "Public users can view trails" 
    ON public.trails FOR SELECT 
    USING (true);

CREATE POLICY "Admins can manage trails"
    ON public.trails FOR ALL
    TO authenticated
    USING (auth.jwt()->>'role' = 'ADMIN')
    WITH CHECK (auth.jwt()->>'role' = 'ADMIN');

-- 3. Landmarks: Public Read Access
CREATE POLICY "Public users can view landmarks"
    ON public.landmarks FOR SELECT
    USING (true);

-- 4. Ranges: Public Read Access
CREATE POLICY "Public users can view ranges"
    ON public.ranges FOR SELECT
    USING (true);

-- 5. Itineraries: Public Read & Creation Access
CREATE POLICY "Public can view itineraries"
    ON public.itineraries FOR SELECT
    USING (true);

CREATE POLICY "Anyone can create custom itineraries"
    ON public.itineraries FOR INSERT
    WITH CHECK (true);

-- 6. Stories: Public Read, Authenticated insert
CREATE POLICY "Public can view stories"
    ON public.stories FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can submit stories"
    ON public.stories FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Public can like stories"
    ON public.stories FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 7. Story Comments: Public Read, Anyone can comment
CREATE POLICY "Public can view story comments"
    ON public.story_comments FOR SELECT
    USING (true);

CREATE POLICY "Anyone can post story comments"
    ON public.story_comments FOR INSERT
    WITH CHECK (true);

-- 8. Weather Reports: Public Read Access
CREATE POLICY "Public can view weather reports"
    ON public.weather_reports FOR SELECT
    USING (true);

-- 9. Bookings: Users can view own bookings; Staff/Admin can view all
CREATE POLICY "Trekkers can view own bookings"
    ON public.bookings FOR SELECT
    USING (auth.uid()::text = user_id OR auth.jwt()->>'role' = 'ADMIN');

CREATE POLICY "Trekkers can create bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can update bookings"
    ON public.bookings FOR UPDATE
    TO authenticated
    USING (auth.jwt()->>'role' = 'ADMIN');

-- 10. Inquiries: Public can insert their own inquiries, authenticated staff can read
CREATE POLICY "Anyone can submit a trek inquiry" 
    ON public.inquiries FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Authenticated staff can view inquiries" 
    ON public.inquiries FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Staff can update inquiries"
    ON public.inquiries FOR UPDATE
    TO authenticated
    USING (true);

-- 11. Contact Messages: Public can insert messages
CREATE POLICY "Anyone can submit contact message" 
    ON public.contact_messages FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view contact messages" 
    ON public.contact_messages FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Staff can update contact message status"
    ON public.contact_messages FOR UPDATE
    TO authenticated
    USING (true);

-- 12. Reviews: Public Read, Authenticated or Verified users insert
CREATE POLICY "Public can view reviews" 
    ON public.reviews FOR SELECT 
    USING (true);

CREATE POLICY "Anyone can submit reviews" 
    ON public.reviews FOR INSERT 
    WITH CHECK (true);

-- 13. Shared Trails: Public Read Approved, Users can submit
CREATE POLICY "Public can view shared trails"
    ON public.shared_trails FOR SELECT
    USING (status = 'APPROVED' OR auth.jwt()->>'role' = 'ADMIN');

CREATE POLICY "Users can share community trails"
    ON public.shared_trails FOR INSERT
    WITH CHECK (true);

-- =========================================================
-- INDEXES FOR ACCELERATED QUERY PERFORMANCE
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_trails_slug ON public.trails(slug);
CREATE INDEX IF NOT EXISTS idx_trails_region ON public.trails(region);
CREATE INDEX IF NOT EXISTS idx_landmarks_region ON public.landmarks(region);
CREATE INDEX IF NOT EXISTS idx_landmarks_trail ON public.landmarks(associated_trail);
CREATE INDEX IF NOT EXISTS idx_itineraries_likes ON public.itineraries(likes DESC);
CREATE INDEX IF NOT EXISTS idx_stories_created ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_created ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_trails_status ON public.shared_trails(status);
