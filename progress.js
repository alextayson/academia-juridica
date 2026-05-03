import { auth, enrollmentAPI, progressAPI } from './supabase-client.js';

let currentUser = null;
let enrollments = [];

async function init() {
    currentUser = await auth.getUser();

    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('userMenu').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.email.split('@')[0];

    await loadProgress();
    setupEventListeners();
}

async function loadProgress() {
    const { data, error } = await enrollmentAPI.getEnrollments();

    if (error) {
        console.error('Error loading progress:', error);
        return;
    }

    enrollments = data || [];
    renderStats();
    renderProgressList();
}

function renderStats() {
    const total = enrollments.length;
    const completed = enrollments.filter(e => e.progress_percent === 100).length;
    const totalMinutes = enrollments.reduce((sum, e) => {
        return sum + (e.course.duration_minutes || 0) * (e.progress_percent / 100);
    }, 0);
    const avgProgress = total > 0
        ? Math.round(enrollments.reduce((sum, e) => sum + e.progress_percent, 0) / total)
        : 0;

    document.getElementById('totalCourses').textContent = total;
    document.getElementById('completedCourses').textContent = completed;
    document.getElementById('totalHours').textContent = Math.round(totalMinutes / 60) + 'h';
    document.getElementById('avgProgress').textContent = avgProgress + '%';
}

function renderProgressList() {
    const container = document.getElementById('progressList');

    const inProgress = enrollments.filter(e => e.progress_percent > 0 && e.progress_percent < 100);

    if (inProgress.length === 0) {
        container.innerHTML = '<p>Nenhum curso em andamento</p>';
        return;
    }

    container.innerHTML = inProgress.map(enrollment => `
        <div class="progress-course">
            <h3>${enrollment.course.title}</h3>
            <div class="progress-bar-large">
                <div class="progress-fill-large" style="width: ${enrollment.progress_percent}%"></div>
            </div>
            <div class="progress-meta">
                <span>${enrollment.progress_percent}% concluído</span>
                <a href="course.html?id=${enrollment.course_id}">Continuar →</a>
            </div>
        </div>
    `).join('');
}

function setupEventListeners() {
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await auth.signOut();
        window.location.href = 'index.html';
    });
}

init();
