import { supabase } from './supabase-client.js';
import { notificationsAPI } from './features-api.js';

let notificationChannel = null;
let unreadCount = 0;

// Initialize notifications
export async function initNotifications() {
    await loadUnreadCount();
    setupNotificationBell();
    subscribeToNotifications();
}

// Load unread count
async function loadUnreadCount() {
    unreadCount = await notificationsAPI.getUnreadCount();
    updateNotificationBadge();
}

// Setup notification bell in nav
function setupNotificationBell() {
    const userMenu = document.getElementById('userMenu');
    if (!userMenu) return;

    const bellHTML = `
        <div class="notification-bell" id="notificationBell" style="position: relative; cursor: pointer;">
            <span style="font-size: 20px;">🔔</span>
            <span class="notification-badge" id="notificationBadge" style="display: none;"></span>
        </div>
        <div class="notification-dropdown" id="notificationDropdown" style="display: none;"></div>
    `;

    userMenu.insertAdjacentHTML('afterbegin', bellHTML);

    document.getElementById('notificationBell')?.addEventListener('click', toggleNotificationDropdown);
}

// Update badge
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;

    if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// Toggle dropdown
async function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    if (dropdown.style.display === 'none') {
        await loadNotifications();
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
}

// Load notifications
async function loadNotifications() {
    const { data, error } = await notificationsAPI.getNotifications(10);

    if (error) {
        console.error('Error loading notifications:', error);
        return;
    }

    renderNotifications(data || []);
}

// Render notifications
function renderNotifications(notifications) {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    if (notifications.length === 0) {
        dropdown.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #999;">
                Nenhuma notificação
            </div>
        `;
        return;
    }

    dropdown.innerHTML = `
        <div style="padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
            <strong>Notificações</strong>
            <button onclick="markAllNotificationsRead()" style="background: none; border: none; color: #714cb6; cursor: pointer; font-size: 12px;">
                Marcar todas como lidas
            </button>
        </div>
        ${notifications.map(notif => `
            <div class="notification-item ${notif.is_read ? 'read' : 'unread'}"
                 onclick="handleNotificationClick('${notif.id}', '${notif.link || ''}')"
                 style="padding: 12px; border-bottom: 1px solid #f0f0f0; cursor: pointer; ${!notif.is_read ? 'background: #f8f5ff;' : ''}">
                <div style="font-weight: 600; margin-bottom: 4px;">${notif.title}</div>
                <div style="font-size: 13px; color: #666; margin-bottom: 4px;">${notif.message}</div>
                <div style="font-size: 11px; color: #999;">${formatNotificationDate(notif.created_at)}</div>
            </div>
        `).join('')}
    `;
}

// Handle notification click
window.handleNotificationClick = async function(notificationId, link) {
    await notificationsAPI.markAsRead(notificationId);
    await loadUnreadCount();

    if (link) {
        window.location.href = link;
    }
};

// Mark all as read
window.markAllNotificationsRead = async function() {
    await notificationsAPI.markAllAsRead();
    await loadUnreadCount();
    await loadNotifications();
};

// Subscribe to real-time notifications
function subscribeToNotifications() {
    notificationChannel = notificationsAPI.subscribeToNotifications((payload) => {
        const notification = payload.new;

        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico'
            });
        }

        // Update count
        unreadCount++;
        updateNotificationBadge();

        // Reload dropdown if open
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown && dropdown.style.display === 'block') {
            loadNotifications();
        }
    });
}

// Request notification permission
export async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
    }
}

// Format date
function formatNotificationDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;

    return date.toLocaleDateString('pt-BR');
}

// Cleanup
export function cleanupNotifications() {
    if (notificationChannel) {
        supabase.removeChannel(notificationChannel);
    }
}
