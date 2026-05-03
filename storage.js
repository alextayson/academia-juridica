// Storage Manager - LocalStorage wrapper
const Storage = {
    // Save course progress
    saveCourseProgress(courseId, data) {
        const key = `course_${courseId}`;
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Get course progress
    getCourseProgress(courseId) {
        const key = `course_${courseId}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    // Save lesson progress
    saveLessonProgress(courseId, lessonId, data) {
        const progress = this.getCourseProgress(courseId) || { lessons: {} };
        progress.lessons[lessonId] = {
            ...progress.lessons[lessonId],
            ...data,
            lastUpdated: Date.now()
        };
        this.saveCourseProgress(courseId, progress);
    },

    // Get lesson progress
    getLessonProgress(courseId, lessonId) {
        const progress = this.getCourseProgress(courseId);
        return progress?.lessons?.[lessonId] || null;
    },

    // Save video time
    saveVideoTime(courseId, lessonId, currentTime) {
        this.saveLessonProgress(courseId, lessonId, {
            currentTime,
            completed: false
        });
    },

    // Mark lesson as completed
    markLessonCompleted(courseId, lessonId) {
        this.saveLessonProgress(courseId, lessonId, {
            completed: true,
            completedAt: Date.now()
        });
    },

    // Calculate course progress percentage
    calculateProgress(courseId, totalLessons) {
        const progress = this.getCourseProgress(courseId);
        if (!progress?.lessons) return 0;

        const completed = Object.values(progress.lessons)
            .filter(l => l.completed).length;

        return Math.round((completed / totalLessons) * 100);
    },

    // Get all courses progress
    getAllProgress() {
        const progress = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('course_')) {
                const courseId = key.replace('course_', '');
                progress[courseId] = this.getCourseProgress(courseId);
            }
        }
        return progress;
    },

    // Clear all progress
    clearAllProgress() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('course_')) {
                keys.push(key);
            }
        }
        keys.forEach(key => localStorage.removeItem(key));
    }
};

// Export for use in other files
window.Storage = Storage;
