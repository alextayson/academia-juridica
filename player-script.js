// Get course ID from URL
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('course') || 'trabalhista-avancado';

// Player state
let isPlaying = false;
let currentTime = 0;
let totalTime = 1680;
let currentCourse = null;
let currentModules = [];
let currentLesson = null;

// Play/Pause
function togglePlay() {
    isPlaying = !isPlaying;
    const playBtn = document.querySelector('.play-btn');
    if (playBtn) {
        playBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
    }
    if (isPlaying) {
        startProgress();
    }
}

// Progress bar click
function handleProgressClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    currentTime = Math.floor(totalTime * percent);
    updateProgress();
}

function updateProgress() {
    const percent = (currentTime / totalTime) * 100;
    const progressFill = document.querySelector('.progress-fill-video');
    if (progressFill) {
        progressFill.style.width = `${percent}%`;
    }
    updateTimeDisplay();
}

function updateTimeDisplay() {
    const timeDisplays = document.querySelectorAll('.time-display span');
    if (timeDisplays.length === 2) {
        timeDisplays[0].textContent = formatTime(currentTime);
        timeDisplays[1].textContent = formatTime(totalTime);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function startProgress() {
    const interval = setInterval(() => {
        if (!isPlaying) {
            clearInterval(interval);
            return;
        }
        currentTime++;

        // Save progress every 5 seconds
        if (currentTime % 5 === 0) {
            Storage.saveVideoTime(courseId, currentLesson.id, currentTime);
        }

        if (currentTime >= totalTime) {
            currentTime = totalTime;
            isPlaying = false;
            const playBtn = document.querySelector('.play-btn');
            if (playBtn) playBtn.textContent = '▶ Play';

            // Mark as completed
            Storage.markLessonCompleted(courseId, currentLesson.id);
            renderModules();
            renderProgress();

            clearInterval(interval);
        }
        updateProgress();
    }, 1000);
}

function handleKeyboard(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
    }
    if (e.code === 'ArrowLeft') {
        currentTime = Math.max(0, currentTime - 10);
        updateProgress();
    }
    if (e.code === 'ArrowRight') {
        currentTime = Math.min(totalTime, currentTime + 10);
        updateProgress();
    }
}

// Start player
initPlayer();

// Initialize player
async function initPlayer() {
    await DataManager.init();
    currentCourse = DataManager.getCourse(courseId);
    currentModules = DataManager.getCourseModules(courseId);

    if (!currentCourse || !currentModules.length) {
        alert('Curso não encontrado');
        window.location.href = 'index.html';
        return;
    }

    // Find active lesson or first incomplete
    findCurrentLesson();

    // Load saved progress
    loadProgress();

    // Render UI
    renderHeader();
    renderModules();
    renderProgress();

    // Setup listeners
    setupPlayerListeners();
}

function findCurrentLesson() {
    for (const module of currentModules) {
        for (const lesson of module.lessons) {
            if (lesson.active || (!lesson.completed && !currentLesson)) {
                currentLesson = lesson;
                return;
            }
        }
    }
    // Fallback to first lesson
    currentLesson = currentModules[0]?.lessons[0];
}

function loadProgress() {
    if (!currentLesson) return;

    const progress = Storage.getLessonProgress(courseId, currentLesson.id);
    if (progress?.currentTime) {
        currentTime = progress.currentTime;
    }
}

function renderHeader() {
    const courseName = document.querySelector('.course-name');
    if (courseName) {
        courseName.textContent = currentCourse.title;
    }
}

function renderModules() {
    const moduleList = document.querySelector('.module-list');
    if (!moduleList) return;

    const modulesHtml = currentModules.map(module => {
        const isActive = module.lessons.some(l => l.id === currentLesson.id);
        const moduleClass = module.completed ? 'completed' : (isActive ? 'active' : '');
        const icon = module.completed ? '✓' : (isActive ? '▶' : '○');

        const lessonsHtml = module.lessons.map(lesson => {
            const lessonClass = lesson.id === currentLesson.id ? 'active' : (lesson.completed ? 'completed' : '');
            const lessonIcon = lesson.id === currentLesson.id ? '▶' : (lesson.completed ? '✓' : '○');

            return `
                <div class="lesson ${lessonClass}" data-lesson-id="${lesson.id}" data-module-id="${module.id}">
                    <span class="lesson-icon">${lessonIcon}</span>
                    <span class="lesson-title">${lesson.title}</span>
                    <span class="lesson-time">${lesson.duration}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="module ${moduleClass}">
                <div class="module-header">
                    <span class="module-icon">${icon}</span>
                    <span class="module-title">${module.title}</span>
                    <span class="module-duration">${module.duration}</span>
                </div>
                <div class="lesson-list" style="display: ${isActive ? 'block' : 'none'}">
                    ${lessonsHtml}
                </div>
            </div>
        `;
    }).join('');

    moduleList.innerHTML = `<h3>Conteúdo do Curso</h3>${modulesHtml}`;
}

function renderProgress() {
    const totalLessons = currentModules.reduce((sum, m) => sum + m.lessons.length, 0);
    const completedLessons = currentModules.reduce((sum, m) =>
        sum + m.lessons.filter(l => l.completed).length, 0);
    const progressPercent = Math.round((completedLessons / totalLessons) * 100);

    // Update circle
    const circle = document.querySelector('.progress-circle circle:last-child');
    const progressText = document.querySelector('.progress-text');
    if (circle && progressText) {
        const circumference = 339.292;
        const offset = circumference - (circumference * progressPercent / 100);
        circle.style.strokeDashoffset = offset;
        progressText.textContent = `${progressPercent}%`;
    }

    // Update info
    const progressInfo = document.querySelector('.progress-info');
    if (progressInfo) {
        const completedModules = currentModules.filter(m => m.completed).length;
        progressInfo.textContent = `${completedModules} de ${currentModules.length} módulos concluídos`;
    }
}

function setupPlayerListeners() {
    // Play/Pause
    const playBtn = document.querySelector('.play-btn');
    const playIcon = document.querySelector('.play-icon');

    playBtn?.addEventListener('click', togglePlay);
    playIcon?.addEventListener('click', togglePlay);

    // Progress bar
    const progressBar = document.querySelector('.progress-bar-video');
    progressBar?.addEventListener('click', handleProgressClick);

    // Tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Module expansion
    const moduleHeaders = document.querySelectorAll('.module-header');
    moduleHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const module = this.parentElement;
            const lessonList = module.querySelector('.lesson-list');
            if (lessonList) {
                lessonList.style.display = lessonList.style.display === 'none' ? 'block' : 'none';
            }
        });
    });

    // Lesson click
    const lessons = document.querySelectorAll('.lesson');
    lessons.forEach(lesson => {
        lesson.addEventListener('click', function() {
            const lessonId = parseInt(this.dataset.lessonId);
            loadLesson(lessonId);
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

function loadLesson(lessonId) {
    // Save current progress
    if (currentLesson) {
        Storage.saveVideoTime(courseId, currentLesson.id, currentTime);
    }

    // Find new lesson
    for (const module of currentModules) {
        const lesson = module.lessons.find(l => l.id === lessonId);
        if (lesson) {
            currentLesson = lesson;
            break;
        }
    }

    // Load saved time
    const progress = Storage.getLessonProgress(courseId, currentLesson.id);
    currentTime = progress?.currentTime || 0;

    // Reset player
    isPlaying = false;
    const playBtn = document.querySelector('.play-btn');
    if (playBtn) playBtn.textContent = '▶ Play';

    updateProgress();
    renderModules();

    console.log(`Carregando: ${currentLesson.title}`);
}
