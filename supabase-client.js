// Supabase Client Configuration
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth helpers
export const auth = {
    // Sign up with email
    async signUp(email, password, fullName) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        });

        if (!error && data.user) {
            await supabase.from('profiles').insert({
                id: data.user.id,
                email: data.user.email,
                full_name: fullName
            });
        }

        return { data, error };
    },

    // Sign in with email
    async signIn(email, password) {
        return await supabase.auth.signInWithPassword({ email, password });
    },

    // Sign in with Google
    async signInWithGoogle() {
        return await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth-callback.html`
            }
        });
    },

    // Sign out
    async signOut() {
        return await supabase.auth.signOut();
    },

    // Get current user
    async getUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    // Get current session
    async getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    // Listen to auth changes
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    }
};

// Course API
export const courseAPI = {
    // Get all published courses
    async getCourses(filters = {}) {
        let query = supabase
            .from('courses')
            .select(`
                *,
                category:categories(*),
                instructor:profiles(id, full_name, avatar_url),
                modules:modules(count)
            `)
            .eq('is_published', true);

        if (filters.category) {
            query = query.eq('category_id', filters.category);
        }

        if (filters.level) {
            query = query.eq('level', filters.level);
        }

        if (filters.search) {
            query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        return { data, error };
    },

    // Get single course with modules and lessons
    async getCourse(courseId) {
        const { data, error } = await supabase
            .from('courses')
            .select(`
                *,
                category:categories(*),
                instructor:profiles(id, full_name, avatar_url),
                modules:modules(
                    *,
                    lessons:lessons(*)
                )
            `)
            .eq('id', courseId)
            .single();

        return { data, error };
    },

    // Get course by slug
    async getCourseBySlug(slug) {
        const { data, error } = await supabase
            .from('courses')
            .select(`
                *,
                category:categories(*),
                instructor:profiles(id, full_name, avatar_url),
                modules:modules(
                    *,
                    lessons:lessons(*)
                )
            `)
            .eq('slug', slug)
            .single();

        return { data, error };
    },

    // Get categories
    async getCategories() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        return { data, error };
    }
};

// Enrollment API
export const enrollmentAPI = {
    // Enroll in course
    async enroll(courseId) {
        const user = await auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('enrollments')
            .insert({
                user_id: user.id,
                course_id: courseId
            })
            .select()
            .single();

        return { data, error };
    },

    // Get user enrollments
    async getEnrollments() {
        const user = await auth.getUser();
        if (!user) return { data: [], error: null };

        const { data, error } = await supabase
            .from('enrollments')
            .select(`
                *,
                course:courses(
                    *,
                    category:categories(*),
                    modules:modules(count)
                )
            `)
            .eq('user_id', user.id)
            .order('enrolled_at', { ascending: false });

        return { data, error };
    },

    // Check if enrolled
    async isEnrolled(courseId) {
        const user = await auth.getUser();
        if (!user) return false;

        const { data } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .single();

        return !!data;
    }
};

// Progress API
export const progressAPI = {
    // Save lesson progress
    async saveProgress(lessonId, currentTime, completed = false) {
        const user = await auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Get enrollment
        const { data: lesson } = await supabase
            .from('lessons')
            .select('module:modules(course_id)')
            .eq('id', lessonId)
            .single();

        const { data: enrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', lesson.module.course_id)
            .single();

        if (!enrollment) throw new Error('Not enrolled in course');

        const { data, error } = await supabase
            .from('lesson_progress')
            .upsert({
                user_id: user.id,
                lesson_id: lessonId,
                enrollment_id: enrollment.id,
                current_time: currentTime,
                completed,
                completed_at: completed ? new Date().toISOString() : null,
                last_watched_at: new Date().toISOString()
            })
            .select()
            .single();

        return { data, error };
    },

    // Get lesson progress
    async getProgress(lessonId) {
        const user = await auth.getUser();
        if (!user) return { data: null, error: null };

        const { data, error } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .single();

        return { data, error };
    },

    // Get course progress
    async getCourseProgress(courseId) {
        const user = await auth.getUser();
        if (!user) return { data: [], error: null };

        const { data: enrollment } = await supabase
            .from('enrollments')
            .select('id, progress_percent')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .single();

        if (!enrollment) return { data: null, error: null };

        const { data, error } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('enrollment_id', enrollment.id);

        return { data: { progress: data, percent: enrollment.progress_percent }, error };
    }
};

// Review API
export const reviewAPI = {
    // Add review
    async addReview(courseId, rating, comment) {
        const user = await auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('reviews')
            .upsert({
                user_id: user.id,
                course_id: courseId,
                rating,
                comment
            })
            .select()
            .single();

        return { data, error };
    },

    // Get course reviews
    async getReviews(courseId) {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                user:profiles(full_name, avatar_url)
            `)
            .eq('course_id', courseId)
            .order('created_at', { ascending: false });

        return { data, error };
    }
};
