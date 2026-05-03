import { auth, courseAPI, enrollmentAPI, progressAPI } from './supabase-client.js';
import { videoAPI } from './video-api.js';
import { notesAPI, commentsAPI } from './features-api.js';

// Global state
let currentUser = null;
let currentCourse = null;
let currentLesson = null;
let userProgress = {};
let lessonNotes = [];
let lessonComments = [];

// Get course ID from URL
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');

// Initialize
async function init() {
    if (!courseId) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = await auth.getUser();

    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Update user menu
    document.getElementById('userMenu').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.email.split('@')[0];

    await loadCourse();
    await loadProgress();
    setupEventListeners();
}

// Load course data
async function loadCourse() {
    const { data, error } = await courseAPI.getCourse(courseId);

    if (error) {
        alert('Erro ao carregar curso: ' + error.message);
        window.location.href = 'index.html';
        return;
    }

    currentCourse = data;

    // Check if enrolled
    const enrolled = await enrollmentAPI.isEnrolled(courseId);
    if (!enrolled) {
        // Auto-enroll
        await enrollmentAPI.enroll(courseId);
    }

    renderCourseHeader();
    renderModules();
}

// Load user progress
async function loadProgress() {
    const { data } = await progressAPI.getCourseProgress(courseId);

    if (data && data.progress) {
        data.progress.forEach(p => {
            userProgress[p.lesson_id] = p;
        });
    }
}

// Render course header
function renderCourseHeader() {
    document.getElementById('courseTitle').textContent = currentCourse.title;
    document.getElementById('courseDescription').textContent = currentCourse.description || '';
    document.getElementById('courseInstructor').textContent = `👤 ${currentCourse.instructor?.full_name || 'Instrutor'}`;
    document.getElementById('courseLevel').textContent = `📊 ${getLevelLabel(currentCourse.level)}`;

    // Calculate progress
    const totalLessons = currentCourse.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const completedLessons = Object.values(userProgress).filter(p => p.completed).length;
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    document.getElementById('courseProgress').textContent = `✓ ${progressPercent}% concluído`;
}

// Render modules and lessons
function renderModules() {
    const container = document.getElementById('modulesList');

    container.innerHTML = currentCourse.modules
        .sort((a, b) => a.order_index - b.order_index)
        .map(module => {
            const lessons = module.lessons.sort((a, b) => a.order_index - b.order_index);

            return `
                <div class="module">
                    <div class="module-header" onclick="toggleModule('${module.id}')">
                        <span>${module.title}</span>
                        <span>▼</span>
                    </div>
                    <div class="lessons-list" id="module-${module.id}">
                        ${lessons.map(lesson => {
                            const progress = userProgress[lesson.id];
                            const completed = progress?.completed || false;

                            return `
                                <div class="lesson-item ${completed ? 'completed' : ''}"
                                     onclick="playLesson('${lesson.id}')"
                                     data-lesson-id="${lesson.id}">
                                    <div class="lesson-checkbox ${completed ? 'checked' : ''}">
                                        ${completed ? '✓' : ''}
                                    </div>
                                    <div class="lesson-title">${lesson.title}</div>
                                    ${lesson.video_duration ? `<div class="lesson-duration">${formatDuration(lesson.video_duration)}</div>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');

    // Open first module by default
    if (currentCourse.modules.length > 0) {
        const firstModule = currentCourse.modules[0];
        document.getElementById(`module-${firstModule.id}`).classList.add('open');

        // Play first lesson
        if (firstModule.lessons.length > 0) {
            playLesson(firstModule.lessons[0].id);
        }
    }
}

// Toggle module open/close
window.toggleModule = function(moduleId) {
    const moduleEl = document.getElementById(`module-${moduleId}`);
    moduleEl.classList.toggle('open');
};

// Play lesson
window.playLesson = async function(lessonId) {
    // Find lesson
    let lesson = null;
    for (const module of currentCourse.modules) {
        lesson = module.lessons.find(l => l.id === lessonId);
        if (lesson) break;
    }

    if (!lesson) return;

    currentLesson = lesson;

    // Update active state
    document.querySelectorAll('.lesson-item').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelector(`[data-lesson-id="${lessonId}"]`).classList.add('active');

    // Update lesson info
    document.getElementById('lessonTitle').textContent = lesson.title;
    document.getElementById('lessonDescription').textContent = lesson.description || '';

    // Load video
    loadVideo(lesson);

    // Load notes and comments
    await loadLessonNotes(lessonId);
    await loadLessonComments(lessonId);

    // Mark as started
    await progressAPI.saveProgress(lessonId, 0, false);
};

// Load video player
function loadVideo(lesson) {
    const player = document.getElementById('videoPlayer');

    if (!lesson.video_url) {
        player.innerHTML = '<p style="color: white; padding: 40px; text-align: center;">Vídeo não disponível</p>';
        return;
    }

    const videoInfo = videoAPI.parseVideoUrl(lesson.video_url);

    player.innerHTML = `
        <iframe
            src="${videoInfo.embedUrl}"
            frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen
            id="videoFrame">
        </iframe>
    `;

    // Setup video tracking
    setupVideoTracking(lesson);
}

// Setup video progress tracking
function setupVideoTracking(lesson) {
    // For YouTube/Vimeo, we'd need their APIs
    // For now, mark as completed when user clicks next

    // Simple completion tracking
    setTimeout(() => {
        markLessonComplete(lesson.id);
    }, 5000); // Mark complete after 5 seconds (demo)
}

// Mark lesson as complete
async function markLessonComplete(lessonId) {
    const progress = userProgress[lessonId];

    if (progress?.completed) return; // Already completed

    await progressAPI.saveProgress(lessonId, 0, true);

    // Update UI
    userProgress[lessonId] = { completed: true };

    const lessonEl = document.querySelector(`[data-lesson-id="${lessonId}"]`);
    lessonEl.classList.add('completed');
    lessonEl.querySelector('.lesson-checkbox').classList.add('checked');
    lessonEl.querySelector('.lesson-checkbox').textContent = '✓';

    // Update header progress
    renderCourseHeader();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await auth.signOut();
        window.location.href = 'index.html';
    });

    // Notes
    document.getElementById('saveNoteBtn')?.addEventListener('click', saveNote);
    document.getElementById('noteContent')?.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') saveNote();
    });

    // Comments
    document.getElementById('postCommentBtn')?.addEventListener('click', postComment);
}

// ==================== NOTES ====================

async function loadLessonNotes(lessonId) {
    const { data, error } = await notesAPI.getLessonNotes(lessonId);

    if (error) {
        console.error('Error loading notes:', error);
        return;
    }

    lessonNotes = data || [];
    renderNotes();
}

function renderNotes() {
    const container = document.getElementById('notesList');
    if (!container) return;

    if (lessonNotes.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Nenhuma anotação ainda</p>';
        return;
    }

    container.innerHTML = lessonNotes.map(note => `
        <div class="note-item" data-note-id="${note.id}">
            <div class="note-header">
                ${note.timestamp_seconds ? `<span class="note-timestamp">⏱ ${formatTime(note.timestamp_seconds)}</span>` : ''}
                <span class="note-date">${formatDate(note.created_at)}</span>
            </div>
            <div class="note-content">${escapeHtml(note.content)}</div>
            <div class="note-actions">
                <button onclick="editNote('${note.id}')" class="note-action-btn">✏️ Editar</button>
                <button onclick="deleteNote('${note.id}')" class="note-action-btn">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
}

async function saveNote() {
    const content = document.getElementById('noteContent')?.value.trim();

    if (!content || !currentLesson) return;

    const { error } = await notesAPI.createNote(currentLesson.id, content);

    if (error) {
        alert('Erro ao salvar anotação: ' + error.message);
        return;
    }

    document.getElementById('noteContent').value = '';
    await loadLessonNotes(currentLesson.id);
}

window.editNote = async function(noteId) {
    const note = lessonNotes.find(n => n.id === noteId);
    if (!note) return;

    const newContent = prompt('Editar anotação:', note.content);
    if (!newContent || newContent === note.content) return;

    const { error } = await notesAPI.updateNote(noteId, newContent);

    if (error) {
        alert('Erro ao atualizar anotação: ' + error.message);
        return;
    }

    await loadLessonNotes(currentLesson.id);
};

window.deleteNote = async function(noteId) {
    if (!confirm('Excluir esta anotação?')) return;

    const { error } = await notesAPI.deleteNote(noteId);

    if (error) {
        alert('Erro ao excluir anotação: ' + error.message);
        return;
    }

    await loadLessonNotes(currentLesson.id);
};

// ==================== COMMENTS ====================

async function loadLessonComments(lessonId) {
    const { data, error } = await commentsAPI.getLessonComments(lessonId);

    if (error) {
        console.error('Error loading comments:', error);
        return;
    }

    lessonComments = data || [];
    renderComments();
}

function renderComments() {
    const container = document.getElementById('commentsList');
    if (!container) return;

    if (lessonComments.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Nenhum comentário ainda. Seja o primeiro!</p>';
        return;
    }

    container.innerHTML = lessonComments.map(comment => `
        <div class="comment-item" data-comment-id="${comment.id}">
            <div class="comment-header">
                <div class="comment-author">
                    ${comment.user.avatar_url ? `<img src="${comment.user.avatar_url}" alt="${comment.user.full_name}">` : '👤'}
                    <strong>${comment.user.full_name}</strong>
                    ${comment.is_instructor_reply ? '<span class="instructor-badge">Instrutor</span>' : ''}
                </div>
                <span class="comment-date">${formatDate(comment.created_at)}</span>
            </div>
            <div class="comment-content">${escapeHtml(comment.content)}</div>
            <div class="comment-actions">
                <button onclick="replyToComment('${comment.id}')" class="comment-action-btn">💬 Responder</button>
                ${comment.user_id === currentUser?.id ? `
                    <button onclick="deleteComment('${comment.id}')" class="comment-action-btn">🗑️ Excluir</button>
                ` : ''}
            </div>
            ${comment.replies && comment.replies.length > 0 ? `
                <div class="comment-replies">
                    ${comment.replies.map(reply => `
                        <div class="comment-item reply">
                            <div class="comment-header">
                                <div class="comment-author">
                                    ${reply.user.avatar_url ? `<img src="${reply.user.avatar_url}" alt="${reply.user.full_name}">` : '👤'}
                                    <strong>${reply.user.full_name}</strong>
                                    ${reply.is_instructor_reply ? '<span class="instructor-badge">Instrutor</span>' : ''}
                                </div>
                                <span class="comment-date">${formatDate(reply.created_at)}</span>
                            </div>
                            <div class="comment-content">${escapeHtml(reply.content)}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function postComment() {
    const content = document.getElementById('commentContent')?.value.trim();

    if (!content || !currentLesson) return;

    const { error } = await commentsAPI.createComment(currentLesson.id, content);

    if (error) {
        alert('Erro ao postar comentário: ' + error.message);
        return;
    }

    document.getElementById('commentContent').value = '';
    await loadLessonComments(currentLesson.id);
}

window.replyToComment = async function(commentId) {
    const content = prompt('Sua resposta:');
    if (!content) return;

    const { error } = await commentsAPI.createComment(currentLesson.id, content, commentId);

    if (error) {
        alert('Erro ao responder: ' + error.message);
        return;
    }

    await loadLessonComments(currentLesson.id);
};

window.deleteComment = async function(commentId) {
    if (!confirm('Excluir este comentário?')) return;

    const { error } = await commentsAPI.deleteComment(commentId);

    if (error) {
        alert('Erro ao excluir comentário: ' + error.message);
        return;
    }

    await loadLessonComments(currentLesson.id);
};

// Helper functions
function getLevelLabel(level) {
    const labels = {
        'beginner': 'Básico',
        'intermediate': 'Intermediário',
        'advanced': 'Avançado'
    };
    return labels[level] || 'Básico';
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    return `${mins}min`;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
init();
