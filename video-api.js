import { supabase } from './supabase-client.js';

// ==================== VIDEO URL PARSING ====================

// Parse video URL and detect platform
export function parseVideoUrl(url) {
    if (!url) return { platform: 'unknown', id: null };

    // YouTube patterns
    const youtubePatterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of youtubePatterns) {
        const match = url.match(pattern);
        if (match) {
            return {
                platform: 'youtube',
                id: match[1]
            };
        }
    }

    // Vimeo patterns
    const vimeoPatterns = [
        /vimeo\.com\/(\d+)/,
        /player\.vimeo\.com\/video\/(\d+)/
    ];

    for (const pattern of vimeoPatterns) {
        const match = url.match(pattern);
        if (match) {
            return {
                platform: 'vimeo',
                id: match[1]
            };
        }
    }

    // Direct video URL
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
        return {
            platform: 'direct',
            id: null
        };
    }

    return { platform: 'unknown', id: null };
}

// Get YouTube embed URL
export function getYouTubeEmbedUrl(videoId) {
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

// Get Vimeo embed URL
export function getVimeoEmbedUrl(videoId) {
    return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
}

// Get video duration from YouTube API
export async function getYouTubeDuration(videoId) {
    const API_KEY = 'YOUR_YOUTUBE_API_KEY'; // Replace with actual key
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${API_KEY}`
        );
        const data = await response.json();

        if (data.items && data.items[0]) {
            const duration = data.items[0].contentDetails.duration;
            return parseISO8601Duration(duration);
        }
    } catch (error) {
        console.error('Error fetching YouTube duration:', error);
    }
    return 0;
}

// Parse ISO 8601 duration (PT1H2M10S -> seconds)
function parseISO8601Duration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    return hours * 3600 + minutes * 60 + seconds;
}

// Load video in player
export function loadVideo(lesson) {
    const player = document.getElementById('videoPlayer');
    if (!player) return;

    const videoUrl = lesson.video_url;
    if (!videoUrl) {
        player.innerHTML = '<p style="color: white; padding: 40px; text-align: center;">Nenhum vídeo disponível</p>';
        return;
    }

    const videoInfo = parseVideoUrl(videoUrl);

    if (videoInfo.platform === 'youtube') {
        const embedUrl = getYouTubeEmbedUrl(videoInfo.id);
        player.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else if (videoInfo.platform === 'vimeo') {
        const embedUrl = getVimeoEmbedUrl(videoInfo.id);
        player.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    } else if (videoInfo.platform === 'direct') {
        player.innerHTML = `<video controls style="width: 100%; height: 100%;"><source src="${videoUrl}" type="video/mp4">Seu navegador não suporta vídeo.</video>`;
    } else {
        player.innerHTML = '<p style="color: white; padding: 40px; text-align: center;">Formato de vídeo não suportado</p>';
    }
}

// ==================== UPLOAD DIRETO ====================

// Upload video to Supabase Storage
export async function uploadVideo(file, onProgress) {
    // Validate file
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];

    if (!allowedTypes.includes(file.type)) {
        return { error: { message: 'Formato não suportado. Use MP4, WebM ou OGG.' } };
    }

    if (file.size > maxSize) {
        return { error: { message: 'Arquivo muito grande. Máximo 500MB.' } };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;
    const filePath = `videos/${filename}`;

    try {
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('course-videos')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) return { error };

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('course-videos')
            .getPublicUrl(filePath);

        return {
            data: {
                path: filePath,
                url: urlData.publicUrl
            }
        };
    } catch (error) {
        return { error: { message: error.message } };
    }
}

// Delete video from storage
export async function deleteVideo(filePath) {
    const { error } = await supabase.storage
        .from('course-videos')
        .remove([filePath]);

    return { error };
}

// Get video metadata from file
export async function getVideoMetadata(file) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = function() {
            window.URL.revokeObjectURL(video.src);
            resolve({
                duration: Math.floor(video.duration),
                width: video.videoWidth,
                height: video.videoHeight
            });
        };

        video.onerror = function() {
            resolve({ duration: 0, width: 0, height: 0 });
        };

        video.src = URL.createObjectURL(file);
    });
}

// ==================== VIDEO API ====================

export const videoAPI = {
    parseVideoUrl,
    getYouTubeEmbedUrl,
    getVimeoEmbedUrl,
    getYouTubeDuration,
    loadVideo,
    uploadVideo,
    deleteVideo,
    getVideoMetadata
};
