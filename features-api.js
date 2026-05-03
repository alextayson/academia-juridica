// Features API - Certificates, Notes, Comments, Notifications

import { supabase } from './supabase-client.js';

// ==================== CERTIFICATES ====================

export const certificateAPI = {
    // Get user certificates
    async getUserCertificates() {
        return await supabase
            .from('certificates')
            .select(`
                *,
                course:courses(title, slug, instructor:profiles(full_name))
            `)
            .order('issued_at', { ascending: false });
    },

    // Get certificate by ID
    async getCertificate(certificateId) {
        return await supabase
            .from('certificates')
            .select(`
                *,
                course:courses(title, slug, instructor:profiles(full_name)),
                user:profiles(full_name, email)
            `)
            .eq('id', certificateId)
            .single();
    },

    // Verify certificate
    async verifyCertificate(verificationCode) {
        return await supabase
            .from('certificates')
            .select(`
                *,
                course:courses(title),
                user:profiles(full_name)
            `)
            .eq('verification_code', verificationCode)
            .single();
    },

    // Check if certificate exists for course
    async hasCertificate(courseId) {
        const { data } = await supabase
            .from('certificates')
            .select('id')
            .eq('course_id', courseId)
            .single();

        return !!data;
    }
};

// ==================== NOTES ====================

export const notesAPI = {
    // Get notes for a lesson
    async getLessonNotes(lessonId) {
        return await supabase
            .from('notes')
            .select('*')
            .eq('lesson_id', lessonId)
            .order('timestamp_seconds', { ascending: true });
    },

    // Create note
    async createNote(lessonId, content, timestampSeconds = null) {
        return await supabase
            .from('notes')
            .insert({
                lesson_id: lessonId,
                content,
                timestamp_seconds: timestampSeconds
            })
            .select()
            .single();
    },

    // Update note
    async updateNote(noteId, content) {
        return await supabase
            .from('notes')
            .update({
                content,
                updated_at: new Date().toISOString()
            })
            .eq('id', noteId)
            .select()
            .single();
    },

    // Delete note
    async deleteNote(noteId) {
        return await supabase
            .from('notes')
            .delete()
            .eq('id', noteId);
    },

    // Get all user notes for a course
    async getCourseNotes(courseId) {
        return await supabase
            .from('notes')
            .select(`
                *,
                lesson:lessons(
                    title,
                    module:modules(title, course_id)
                )
            `)
            .eq('lesson.module.course_id', courseId)
            .order('created_at', { ascending: false });
    }
};

// ==================== COMMENTS ====================

export const commentsAPI = {
    // Get comments for a lesson
    async getLessonComments(lessonId) {
        return await supabase
            .from('comments')
            .select(`
                *,
                user:profiles(full_name, avatar_url, role),
                replies:comments(
                    *,
                    user:profiles(full_name, avatar_url, role)
                )
            `)
            .eq('lesson_id', lessonId)
            .is('parent_id', null)
            .order('created_at', { ascending: false });
    },

    // Create comment
    async createComment(lessonId, content, parentId = null) {
        return await supabase
            .from('comments')
            .insert({
                lesson_id: lessonId,
                content,
                parent_id: parentId
            })
            .select(`
                *,
                user:profiles(full_name, avatar_url, role)
            `)
            .single();
    },

    // Update comment
    async updateComment(commentId, content) {
        return await supabase
            .from('comments')
            .update({
                content,
                updated_at: new Date().toISOString()
            })
            .eq('id', commentId)
            .select()
            .single();
    },

    // Delete comment
    async deleteComment(commentId) {
        return await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);
    },

    // Get comment count for lesson
    async getCommentCount(lessonId) {
        const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('lesson_id', lessonId);

        return count || 0;
    }
};

// ==================== NOTIFICATIONS ====================

export const notificationsAPI = {
    // Get user notifications
    async getNotifications(limit = 20) {
        return await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
    },

    // Get unread count
    async getUnreadCount() {
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);

        return count || 0;
    },

    // Mark as read
    async markAsRead(notificationId) {
        return await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
    },

    // Mark all as read
    async markAllAsRead() {
        return await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('is_read', false);
    },

    // Delete notification
    async deleteNotification(notificationId) {
        return await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);
    },

    // Subscribe to real-time notifications
    subscribeToNotifications(callback) {
        return supabase
            .channel('notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${supabase.auth.getUser().id}`
            }, callback)
            .subscribe();
    }
};
