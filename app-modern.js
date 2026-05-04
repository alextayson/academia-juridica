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
}

// Check authentication
async function checkAuth() {
    currentUser = await auth.getUser();

    if (currentUser) {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('userMenu').style.display = 'flex';

        const avatar = document.getElementById('userAvatar');
        if (avatar) {
            const initial = currentUser.email.charAt(0).toUpperCase();
            avatar.textContent = initial;
            avatar.setAttribute('data-tooltip', currentUser.email);
        }
    } else {
        document.getElementById('loginBtn').style.display = 'block';
        document.getElementById('userMenu').style.display = 'none';
    }
}

// Load courses from Supabase
async function loadCourses() {
    const loadingEl = document.getElementById('coursesLoading');
    const gridEl = document.getElementById('coursesGrid');

    const { data, error } = await courseAPI.getCourses();

    if (error) {
        console.error('Error loading courses:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        if (gridEl) {
            gridEl.style.display = 'grid';
            gridEl.innerHTML = '<p style="color: white; grid-column: 1/-1; text-align: center;">Erro ao carregar cursos</p>';
        }
        return;
    }

    allCourses = data || [];
    renderCourses();
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

// Render courses with modern design
function renderCourses() {
    const loadingEl = document.getElementById('coursesLoading');
    const gridEl = document.getElementById('coursesGrid');

    if (!gridEl) return;

    if (loadingEl) loadingEl.style.display = 'none';
    gridEl.style.display = 'grid';

    if (allCourses.length === 0) {
        gridEl.innerHTML = '<p style="color: white; grid-column: 1/-1; text-align: center;">Nenhum curso disponível</p>';
        return;
    }

    gridEl.innerHTML = allCourses.map(course => createCourseCard(course)).join('');

    // Re-initialize Lucide icons
    if (window.lucide) lucide.createIcons();
}

// Create modern course card
function createCourseCard(course) {
    const enrolled = isEnrolled(course.id);
    const isNew = course.created_at && isNewCourse(course.created_at);

    return `
        <div class="course-card" data-course-id="${course.id}" onclick="handleCourseAction('${course.id}')">
            <div style="position: relative; overflow: hidden;">
                ${course.thumbnail_url
                    ? `<img src="${course.thumbnail_url}" alt="${course.title}" class="course-thumbnail">`
                    : `<div class="course-thumbnail" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); display: flex; align-items: center; justify-content: center; font-size: 48px;">📚</div>`
                }
                ${isNew ? '<span class="badge badge-accent" style="position: absolute; top: 16px; right: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"><i data-lucide="sparkles" style="width: 12px; height: 12px;"></i> Novo</span>' : ''}
                ${enrolled ? '<span class="badge badge-success" style="position: absolute; top: 16px; left: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"><i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> Matriculado</span>' : ''}
            </div>
            <div class="course-content">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.description || 'Aprenda com especialistas e transforme sua carreira jurídica'}</p>
                <div class="course-meta">
                    <span class="course-meta-item">
                        <i data-lucide="book-open" style="width: 14px; height: 14px;"></i>
                        ${course.modules_count || 0} módulos
                    </span>
                    <span class="course-meta-item">
                        <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                        ${formatDuration(course.duration_minutes)}
                    </span>
                    <span class="course-meta-item">
                        <i data-lucide="star" style="width: 14px; height: 14px; fill: currentColor;"></i>
                        4.9
                    </span>
                </div>
                <div class="course-footer">
                    <div class="course-instructor">
                        <div class="instructor-avatar">${course.instructor?.charAt(0).toUpperCase() || 'A'}</div>
                        <span>${course.instructor || 'Academia Jurídica'}</span>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); handleCourseAction('${course.id}')" style="box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                        ${enrolled ? '<i data-lucide="play-circle" style="width: 16px; height: 16px;"></i> Continuar' : '<i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i> Iniciar'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Render continue watching section
function renderContinueWatching() {
    const loadingEl = document.getElementById('continueLoading');
    const gridEl = document.getElementById('continueGrid');

    if (!gridEl) return;

    const inProgress = userEnrollments.filter(e => e.progress_percent > 0 && e.progress_percent < 100);

    if (loadingEl) loadingEl.style.display = 'none';

    if (inProgress.length === 0) {
        gridEl.style.display = 'none';
        return;
    }

    gridEl.style.display = 'grid';
    gridEl.innerHTML = inProgress.map(enrollment => createProgressCard(enrollment)).join('');

    // Re-initialize Lucide icons
    if (window.lucide) lucide.createIcons();
}

// Create progress card
function createProgressCard(enrollment) {
    const course = enrollment.course;
    const progress = Math.round(enrollment.progress_percent || 0);

    return `
        <div class="course-card" data-course-id="${course.id}" onclick="handleCourseAction('${course.id}')">
            <div style="position: relative; overflow: hidden;">
                ${course.thumbnail_url
                    ? `<img src="${course.thumbnail_url}" alt="${course.title}" class="course-thumbnail">`
                    : `<div class="course-thumbnail" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); display: flex; align-items: center; justify-content: center; font-size: 48px;">📚</div>`
                }
                <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 70%, transparent 100%);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="color: white; font-size: 14px; font-weight: 700;">${progress}% concluído</span>
                        <span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);"><i data-lucide="zap" style="width: 12px; height: 12px;"></i> Em andamento</span>
                    </div>
                    <div class="progress-bar" style="height: 8px;">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>
            <div class="course-content">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.description || 'Continue sua jornada de aprendizado'}</p>
                <div class="course-meta" style="margin-bottom: 16px;">
                    <span class="course-meta-item">
                        <i data-lucide="book-open" style="width: 14px; height: 14px;"></i>
                        ${course.modules_count || 0} módulos
                    </span>
                    <span class="course-meta-item">
                        <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                        ${formatDuration(course.duration_minutes)}
                    </span>
                </div>
                <button class="btn btn-primary" style="width: 100%; justify-content: center; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);" onclick="event.stopPropagation(); handleCourseAction('${course.id}')">
                    <i data-lucide="play-circle" style="width: 18px; height: 18px;"></i>
                    Continuar Assistindo
                </button>
            </div>
        </div>
    `;
}

// Handle course action (enroll or continue)
window.handleCourseAction = async function(courseId) {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    const enrolled = isEnrolled(courseId);

    if (!enrolled) {
        const { error } = await enrollmentAPI.enroll(courseId);

        if (error) {
            showToast('Erro ao se inscrever no curso', 'error');
            return;
        }

        await loadEnrollments();
        showToast('Matriculado com sucesso!', 'success');
    }

    window.location.href = `course.html?id=${courseId}`;
};

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');

    searchInput?.addEventListener('input', (e) => {
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
    const gridEl = document.getElementById('coursesGrid');
    if (!gridEl) return;

    if (courses.length === 0) {
        gridEl.innerHTML = '<p style="color: white; grid-column: 1/-1; text-align: center;">Nenhum curso encontrado</p>';
        return;
    }

    gridEl.innerHTML = courses.map(course => createCourseCard(course)).join('');

    // Re-initialize Lucide icons
    if (window.lucide) lucide.createIcons();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('loginBtn')?.addEventListener('click', () => {
        window.location.href = 'login.html';
    });

    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await auth.signOut();
        window.location.reload();
    });

    setupSearch();
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

function formatDuration(minutes) {
    if (!minutes) return '0h';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#51cf66' : type === 'error' ? '#ff6b6b' : '#714cb6'};
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Listen to auth changes
auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        window.location.reload();
    }
});

// Initialize on load
init();
