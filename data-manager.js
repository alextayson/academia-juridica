// Data Manager - Load and manage course data
const DataManager = {
    courses: [],
    categories: [],
    modules: {},

    async init() {
        await this.loadCourses();
        await this.loadModules();
    },

    async loadCourses() {
        try {
            const response = await fetch('data/courses.json');
            const data = await response.json();
            this.courses = data.courses;
            this.categories = data.categories;
        } catch (error) {
            console.error('Error loading courses:', error);
        }
    },

    async loadModules() {
        try {
            const response = await fetch('data/modules.json');
            this.modules = await response.json();
        } catch (error) {
            console.error('Error loading modules:', error);
        }
    },

    getCourse(courseId) {
        return this.courses.find(c => c.id === courseId);
    },

    getCourseModules(courseId) {
        return this.modules[courseId]?.modules || [];
    },

    searchCourses(query) {
        const q = query.toLowerCase();
        return this.courses.filter(course =>
            course.title.toLowerCase().includes(q) ||
            course.description.toLowerCase().includes(q)
        );
    },

    filterByCategory(categoryId) {
        if (!categoryId) return this.courses;
        return this.courses.filter(c => c.category === categoryId);
    },

    filterByLevel(level) {
        if (!level) return this.courses;
        return this.courses.filter(c => c.level === level);
    },

    sortCourses(courses, sortBy) {
        const sorted = [...courses];
        switch(sortBy) {
            case 'popular':
                return sorted.sort((a, b) => b.students - a.students);
            case 'rating':
                return sorted.sort((a, b) => b.rating - a.rating);
            case 'newest':
                return sorted.filter(c => c.badge === 'new');
            case 'title':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            default:
                return sorted;
        }
    }
};

window.DataManager = DataManager;
