import { auth, courseAPI, enrollmentAPI, progressAPI } from './supabase-client.js';

// Global state
let currentUser = null;
let allCourses = [];
let userEnrollments = [];

// Initialize app
async function init() {
    await checkAuth();
    await loadCourses();
    await loadEnrollments();
    setupEventListeners();
    renderCourses();
}

// Check authentication
async function checkAuth() {
    currentUser = await auth.getUser();

    if (currentUser) {
        // User is logged in
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('userMenu').style.display = 'flex';
        document.getElementById('userName').textContent = currentUser.email.split('@')[0];
    } else {
        // User not logged in
        document.getElementById('loginBtn').style.display = 'block';
        document.getElementById('userMenu').style.display = 'none';
    }
}

// Load courses from Supabase
async function loadCourses() {
    const { data, error } = await courseAPI.getCourses();

    if (error) {
        console.error('Error loading courses:', error);
        return;
    }

    allCourses = data || [];
}

// Load user enrollments
async function loadEnrollments() {
    if (!currentUser) return;

    const { data, error } = await enrollmentAPI.getEnrollments();

    if (error) {
        console.error('Error loading enrollments:', error);
        return;
    }

    userEnrollments = data || [];
    renderContinueWatching();
}

// Render courses
function renderCourses() {
    const grid = document.querySelector('.section:last-child .course-grid');
    if (!grid) return;

    grid.innerHTML = allCourses.map(course => `
        <div class="course-card" data-course-id="${course.id}">
            <div class="course-thumbnail">
                ${course.thumbnail_url ? `<img src="${course.thumbnail_url}" alt="${course.title}">` : ''}
                ${course.created_at && isNewCourse(course.created_at) ? '<div class="course-badge new">Novo</div>' : ''}
            </div>
            <div class="course-info">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-meta">${course.modules?.length || 0} módulos • ${course.duration_minutes || 0}h de conteúdo</p>
                <p class="course-description">${course.description || ''}</p>
                <div class="course-footer">
                    <span class="course-level">${getLevelLabel(course.level)}</span>
                    <button class="course-action" onclick="handleCourseAction('${course.id}')">
                        ${isEnrolled(course.id) ? 'Continuar' : 'Iniciar'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Render continue watching section
function renderContinueWatching() {
    const section = document.querySelector('.section:first-of-type .course-grid');
    if (!section) return;

    const inProgress = userEnrollments.filter(e => e.progress_percent > 0 && e.progress_percent < 100);

    if (inProgress.length === 0) {
        section.innerHTML = '<p>Nenhum curso em andamento</p>';
        return;
    }

    section.innerHTML = inProgress.map(enrollment => `
        <div class="course-card progress" data-course-id="${enrollment.course.id}">
            <div class="course-thumbnail">
                ${enrollment.course.thumbnail_url ? `<img src="${enrollment.course.thumbnail_url}" alt="${enrollment.course.title}">` : ''}
                <div class="course-badge">Em andamento</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${enrollment.progress_percent}%"></div>
                </div>
            </div>
            <div class="course-info">
                <h3 class="course-title">${enrollment.course.title}</h3>
                <p class="course-meta">${enrollment.progress_percent}% concluído</p>
                <p class="course-description">${enrollment.course.description || ''}</p>
                <button class="course-action" onclick="handleCourseAction('${enrollment.course.id}')">Continuar</button>
            </div>
        </div>
    `).join('');
}

// Handle course action (enroll or continue)
window.handleCourseAction = async function(courseId) {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    const enrolled = isEnrolled(courseId);

    if (!enrolled) {
        // Enroll user
        const { error } = await enrollmentAPI.enroll(courseId);

        if (error) {
            alert('Erro ao se inscrever no curso: ' + error.message);
            return;
        }

        await loadEnrollments();
    }

    // Redirect to course page
    window.location.href = `course.html?id=${courseId}`;
};

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();

        const filtered = allCourses.filter(course =>
            course.title.toLowerCase().includes(query) ||
            course.description?.toLowerCase().includes(query)
        );

        renderFilteredCourses(filtered);
    });
}

// Render filtered courses
function renderFilteredCourses(courses) {
    const grid = document.querySelector('.section:last-child .course-grid');
    if (!grid) return;

    if (courses.length === 0) {
        grid.innerHTML = '<p>Nenhum curso encontrado</p>';
        return;
    }

    grid.innerHTML = courses.map(course => `
        <div class="course-card" data-course-id="${course.id}">
            <div class="course-thumbnail">
                ${course.thumbnail_url ? `<img src="${course.thumbnail_url}" alt="${course.title}">` : ''}
            </div>
            <div class="course-info">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-meta">${course.modules?.length || 0} módulos</p>
                <p class="course-description">${course.description || ''}</p>
                <div class="course-footer">
                    <span class="course-level">${getLevelLabel(course.level)}</span>
                    <button class="course-action" onclick="handleCourseAction('${course.id}')">
                        ${isEnrolled(course.id) ? 'Continuar' : 'Iniciar'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Login button
    document.getElementById('loginBtn')?.addEventListener('click', () => {
        window.location.href = 'login.html';
    });

    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await auth.signOut();
        window.location.reload();
    });

    // Search
    setupSearch();

    // Category filters
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', async () => {
            const categoryName = card.querySelector('.category-title').textContent;
            await filterByCategory(categoryName);
        });
    });
}

// Filter by category
async function filterByCategory(categoryName) {
    const filtered = allCourses.filter(course =>
        course.category?.name === categoryName
    );
    renderFilteredCourses(filtered);
}

// Helper functions
function isEnrolled(courseId) {
    return userEnrollments.some(e => e.course_id === courseId);
}

function isNewCourse(createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const daysDiff = (now - created) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
}

function getLevelLabel(level) {
    const labels = {
        'beginner': 'Básico',
        'intermediate': 'Intermediário',
        'advanced': 'Avançado'
    };
    return labels[level] || 'Básico';
}

// Listen to auth changes
auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        window.location.reload();
    } else if (event === 'SIGNED_OUT') {
        window.location.reload();
    }
});

// Initialize on load
init();
