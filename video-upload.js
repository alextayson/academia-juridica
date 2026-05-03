import { uploadVideo, getVideoMetadata, parseVideoUrl } from './video-api.js';

let selectedFile = null;
let videoMetadata = null;

// Initialize
function init() {
    setupDropZone();
    setupFileInput();
}

// Setup drop zone
function setupDropZone() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });
}

// Setup file input
function setupFileInput() {
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

// Handle file selection
async function handleFileSelect(file) {
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedTypes.includes(file.type)) {
        showError('Formato não suportado. Use MP4, WebM ou OGG.');
        return;
    }

    // Validate file size (500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('Arquivo muito grande. Máximo 500MB.');
        return;
    }

    selectedFile = file;

    // Show preview
    const preview = document.getElementById('videoPreview');
    const video = document.getElementById('previewVideo');
    video.src = URL.createObjectURL(file);
    preview.style.display = 'block';

    // Get metadata
    videoMetadata = await getVideoMetadata(file);

    // Show info
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileDuration').textContent = formatDuration(videoMetadata.duration);
    document.getElementById('fileResolution').textContent = `${videoMetadata.width}x${videoMetadata.height}`;
    document.getElementById('videoInfo').style.display = 'block';

    // Show upload button
    document.getElementById('uploadBtn').style.display = 'block';
}

// Upload button click
document.getElementById('uploadBtn')?.addEventListener('click', async () => {
    if (!selectedFile) return;

    const uploadBtn = document.getElementById('uploadBtn');
    const progressDiv = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    uploadBtn.disabled = true;
    progressDiv.style.display = 'block';

    try {
        const result = await uploadVideo(selectedFile, (percent) => {
            progressFill.style.width = percent + '%';
            progressText.textContent = Math.round(percent) + '%';
        });

        if (result.error) {
            showError(result.error.message);
            return;
        }

        showSuccess(`Vídeo enviado com sucesso! URL: ${result.data.url}`);

        // Store URL in localStorage for use in lesson creation
        localStorage.setItem('lastUploadedVideoUrl', result.data.url);
        localStorage.setItem('lastUploadedVideoDuration', videoMetadata.duration);

        // Reset form after 2 seconds
        setTimeout(() => {
            resetForm();
        }, 2000);

    } catch (error) {
        showError('Erro ao fazer upload: ' + error.message);
    } finally {
        uploadBtn.disabled = false;
    }
});

// Switch tabs
window.switchUploadTab = function(tab) {
    document.querySelectorAll('.upload-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tab + 'Tab').classList.add('active');
};

// Process YouTube URL
window.processYouTubeUrl = function() {
    const url = document.getElementById('youtubeUrl').value.trim();
    if (!url) {
        showError('Digite uma URL do YouTube');
        return;
    }

    const videoInfo = parseVideoUrl(url);
    if (videoInfo.platform !== 'youtube') {
        showError('URL inválida do YouTube');
        return;
    }

    localStorage.setItem('lastUploadedVideoUrl', url);
    showSuccess('URL do YouTube salva! ID do vídeo: ' + videoInfo.id);

    setTimeout(() => {
        window.location.href = 'admin.html';
    }, 1500);
};

// Process Vimeo URL
window.processVimeoUrl = function() {
    const url = document.getElementById('vimeoUrl').value.trim();
    if (!url) {
        showError('Digite uma URL do Vimeo');
        return;
    }

    const videoInfo = parseVideoUrl(url);
    if (videoInfo.platform !== 'vimeo') {
        showError('URL inválida do Vimeo');
        return;
    }

    localStorage.setItem('lastUploadedVideoUrl', url);
    showSuccess('URL do Vimeo salva! ID do vídeo: ' + videoInfo.id);

    setTimeout(() => {
        window.location.href = 'admin.html';
    }, 1500);
};

// Helper functions
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';
}

function resetForm() {
    selectedFile = null;
    videoMetadata = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('videoPreview').style.display = 'none';
    document.getElementById('videoInfo').style.display = 'none';
    document.getElementById('uploadBtn').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = '0%';
}

init();
