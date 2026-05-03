// Player functionality
let isPlaying = false;
let currentTime = 750; // 12:30 in seconds
const totalTime = 1680; // 28:00 in seconds

// Play/Pause
const playBtn = document.querySelector('.play-btn');
const playIcon = document.querySelector('.play-icon');

playBtn?.addEventListener('click', togglePlay);
playIcon?.addEventListener('click', togglePlay);

function togglePlay() {
    isPlaying = !isPlaying;
    if (playBtn) {
        playBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
    }
    if (isPlaying) {
        startProgress();
    }
}

// Progress bar
const progressBar = document.querySelector('.progress-bar-video');
const progressFill = document.querySelector('.progress-fill-video');

progressBar?.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    currentTime = Math.floor(totalTime * percent);
    updateProgress();
});

function updateProgress() {
    const percent = (currentTime / totalTime) * 100;
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
        if (currentTime >= totalTime) {
            currentTime = totalTime;
            isPlaying = false;
            playBtn.textContent = '▶ Play';
            clearInterval(interval);
        }
        updateProgress();
    }, 1000);
}

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
        lessons.forEach(l => l.classList.remove('active'));
        this.classList.add('active');

        const lessonTitle = this.querySelector('.lesson-title').textContent;
        console.log(`Carregando: ${lessonTitle}`);

        // Reset video
        currentTime = 0;
        isPlaying = false;
        if (playBtn) playBtn.textContent = '▶ Play';
        updateProgress();
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
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
});

// Initialize
updateProgress();
