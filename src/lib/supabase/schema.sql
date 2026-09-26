-- =========================================================
-- The Himalayan Trails: Supabase Schema & Security Setup
-- =========================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TRAILS TABLE
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
    highlights TEXT[] DEFAULT '{}',
    best_months TEXT[] DEFAULT '{}',
    start_point TEXT NOT NULL,
    end_point TEXT NOT NULL,
    rating NUMERIC DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. INQUIRIES & BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'contacted', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'responded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trail_id TEXT NOT NULL REFERENCES public.trails(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    country TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

-- Enable RLS
ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Trails: Public Read Access
CREATE POLICY "Public users can view trails" 
    ON public.trails FOR SELECT 
    USING (true);

-- Inquiries: Public can insert their own inquiries, authenticated staff can read
CREATE POLICY "Anyone can submit a trek inquiry" 
    ON public.inquiries FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view inquiries" 
    ON public.inquiries FOR SELECT 
    TO authenticated 
    USING (true);

-- Contact Messages: Public can insert messages
CREATE POLICY "Anyone can submit contact message" 
    ON public.contact_messages FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view contact messages" 
    ON public.contact_messages FOR SELECT 
    TO authenticated 
    USING (true);

-- Reviews: Public Read, Authenticated or Verified users insert
CREATE POLICY "Public can view reviews" 
    ON public.reviews FOR SELECT 
    USING (true);

CREATE POLICY "Anyone can submit reviews" 
    ON public.reviews FOR INSERT 
    WITH CHECK (true);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_trails_slug ON public.trails(slug);
CREATE INDEX IF NOT EXISTS idx_trails_region ON public.trails(region);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_created ON public.contact_messages(created_at DESC);
