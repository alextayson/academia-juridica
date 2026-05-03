-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE public.courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    instructor_id UUID REFERENCES public.profiles(id),
    category_id UUID REFERENCES public.categories(id),
    level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    duration_minutes INTEGER,
    price DECIMAL(10,2) DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modules table
CREATE TABLE public.modules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lessons table
CREATE TABLE public.lessons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    video_provider TEXT CHECK (video_provider IN ('vimeo', 'youtube', 'direct')),
    video_duration INTEGER,
    order_index INTEGER NOT NULL,
    is_preview BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE public.enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percent INTEGER DEFAULT 0,
    UNIQUE(user_id, course_id)
);

-- Lesson progress table
CREATE TABLE public.lesson_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
    current_time INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Reviews table
CREATE TABLE public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Row Level Security (RLS) Policies

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
    ON public.categories FOR SELECT
    USING (true);

-- Courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published courses are viewable by everyone"
    ON public.courses FOR SELECT
    USING (is_published = true OR instructor_id = auth.uid());

CREATE POLICY "Instructors can manage own courses"
    ON public.courses FOR ALL
    USING (instructor_id = auth.uid());

-- Modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Modules viewable if course is accessible"
    ON public.modules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = modules.course_id
            AND (courses.is_published = true OR courses.instructor_id = auth.uid())
        )
    );

-- Lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lessons viewable if enrolled or preview"
    ON public.lessons FOR SELECT
    USING (
        is_preview = true OR
        EXISTS (
            SELECT 1 FROM public.modules m
            JOIN public.courses c ON c.id = m.course_id
            JOIN public.enrollments e ON e.course_id = c.id
            WHERE m.id = lessons.module_id
            AND e.user_id = auth.uid()
        )
    );

-- Enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments"
    ON public.enrollments FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own enrollments"
    ON public.enrollments FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Lesson Progress
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress"
    ON public.lesson_progress FOR ALL
    USING (user_id = auth.uid());

-- Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own reviews"
    ON public.reviews FOR ALL
    USING (user_id = auth.uid());

-- Functions and Triggers

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update course rating on new review
CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.courses
    SET rating = (
        SELECT AVG(rating)::DECIMAL(3,2)
        FROM public.reviews
        WHERE course_id = NEW.course_id
    )
    WHERE id = NEW.course_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_rating_trigger
    AFTER INSERT OR UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_course_rating();

-- Update enrollment progress
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
    progress INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_lessons
    FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.enrollments e ON e.course_id = m.course_id
    WHERE e.id = NEW.enrollment_id;

    SELECT COUNT(*) INTO completed_lessons
    FROM public.lesson_progress
    WHERE enrollment_id = NEW.enrollment_id
    AND completed = true;

    progress := CASE
        WHEN total_lessons > 0 THEN (completed_lessons * 100 / total_lessons)
        ELSE 0
    END;

    UPDATE public.enrollments
    SET progress_percent = progress,
        completed_at = CASE WHEN progress = 100 THEN NOW() ELSE NULL END
    WHERE id = NEW.enrollment_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enrollment_progress_trigger
    AFTER INSERT OR UPDATE ON public.lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollment_progress();

-- Indexes for performance
CREATE INDEX idx_courses_category ON public.courses(category_id);
CREATE INDEX idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX idx_modules_course ON public.modules(course_id);
CREATE INDEX idx_lessons_module ON public.lessons(module_id);
CREATE INDEX idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX idx_lesson_progress_user ON public.lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON public.lesson_progress(lesson_id);
CREATE INDEX idx_reviews_course ON public.reviews(course_id);
