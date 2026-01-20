// Shared API Helper
const API = {
    async get(endpoint) {
        const res = await fetch(endpoint, {
            headers: { 'Content-Type': 'application/json' }
        });
        return res.json();
    },
    async post(endpoint, data, customHeaders = {}) {
        const isFormData = data instanceof FormData;
        const headers = isFormData ? { ...customHeaders } : { 'Content-Type': 'application/json', ...customHeaders };
        const body = isFormData ? data : JSON.stringify(data);

        const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body
        });
        const json = await res.json();
        return { ok: res.ok, status: res.status, ...json };
    },
    async put(endpoint, data, customHeaders = {}) {
        const isFormData = data instanceof FormData;
        const headers = isFormData ? { ...customHeaders } : { 'Content-Type': 'application/json', ...customHeaders };
        const body = isFormData ? data : JSON.stringify(data);

        const res = await fetch(endpoint, {
            method: 'PUT',
            headers,
            body
        });
        const json = await res.json();
        return { ok: res.ok, status: res.status, ...json };
    },
    async delete(endpoint) {
        const res = await fetch(endpoint, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        const json = await res.json();
        return { ok: res.ok, status: res.status, ...json };
    }
};

// Check auth status
async function checkAuth() {
    const res = await fetch('/api/user/me');
    if (res.ok) {
        return await res.json();
    }
    return null;
}

// Redirect if not authenticated (for protected pages)
async function requireAuth() {
    const user = await checkAuth();
    if (!user) {
        window.location.href = 'signin.html';
    }
    return user;
}

// Redirect if authenticated (for public pages like signin/signup)
async function redirectIfAuth() {
    const user = await checkAuth();
    if (user) {
        window.location.href = 'dashboard.html';
    }
}

// Navbar updater
document.addEventListener('DOMContentLoaded', async () => {
    // Mobile Nav Toggle
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('header nav');
    const body = document.body;

    if (navToggle && nav) {
        navToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            navToggle.classList.toggle('nav-open');
            // Prevent scrolling when menu is open
            if (nav.classList.contains('active')) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
        });

        // Close menu when clicking a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                navToggle.classList.remove('nav-open');
                body.style.overflow = '';
            });
        });
    }

    // Add logic to update nav based on auth state if needed
    // Simple implementation: Pages have hardcoded navs or update via JS
});

// Custom Alert System
// Custom Modern Toast System
window.showToast = function (message, type = 'info', title = null) {
    return new Promise((resolve) => {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // --- SMART UPDATE (Prevents Glitching) ---
        // Check if there is already an active toast
        const existingToast = container.querySelector('.toast');

        if (existingToast) {
            // Update existing toast content instead of destroying it
            const content = existingToast.querySelector('.toast-content');
            if (content) {
                content.querySelector('.toast-title').textContent = title || (type === 'success' ? 'Success' : 'Info');
                content.querySelector('.toast-message').textContent = message;
            }

            // Update Type/Icon if needed
            existingToast.className = `toast ${type}`;
            // (Optional: update SVG icon if type changes - simplifying for stability)

            // RESET ANIMATION (The "Glitch Fix")
            // Removing animation property triggers a reflow, allowing it to restart smoothly
            existingToast.style.animation = 'none';
            existingToast.offsetHeight; /* trigger reflow */
            existingToast.style.animation = 'slideIn 1.5s cubic-bezier(0.2, 0.8, 0.2, 1)'; // Re-apply your custom animation

            // RESET TIMER
            // Clear previous auto-close timer attached to the element
            if (existingToast.dismissTimer) clearTimeout(existingToast.dismissTimer);
            existingToast.dismissTimer = setTimeout(() => {
                existingToast.classList.add('hiding');
                existingToast.addEventListener('animationend', () => {
                    existingToast.remove();
                    if (container.children.length === 0) container.remove();
                }, { once: true });
            }, 8000);

            resolve();
            return;
        }

        // --- NEW TOAST CREATION (If none exists) ---
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Icons
        let iconSvg = '';
        if (type === 'success') {
            iconSvg = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />';
        } else if (type === 'error') {
            iconSvg = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />';
        } else {
            iconSvg = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />';
        }

        // Default titles if not provided
        if (!title) {
            if (type === 'success') title = 'Success';
            else if (type === 'error') title = 'Error';
            else title = 'Information';
        }

        toast.innerHTML = `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="${type === 'success' ? '#238636' : type === 'error' ? '#da3633' : '#58a6ff'}">
                ${iconSvg}
            </svg>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        `;

        // Close logic
        const close = () => {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => {
                toast.remove();
                if (container.children.length === 0) container.remove();
                resolve(); // Resolve promise when closed
            });
        };

        toast.querySelector('.toast-close').onclick = close;

        // Auto dismiss - Attached to element for clearing later
        toast.dismissTimer = setTimeout(close, 8000);

        container.appendChild(toast);
    });
};

// (Legacy Alert Removed)

// Shared Sidebar Logic
function initSidebar() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        // Highlight active link
        const currentPath = window.location.pathname;
        const links = sidebar.querySelectorAll('a');
        links.forEach(link => {
            if (link.getAttribute('href') === 'index.html#plans') return; // Skip anchor links unless we are precise
            if (currentPath.endsWith(link.getAttribute('href')) || (currentPath === '/' && link.getAttribute('href') === 'index.html')) {
                link.classList.add('active');
            }
        });

        // Handle root/dashboard specific case
        if (currentPath.endsWith('/') || currentPath.endsWith('dashboard.html')) {
            const dashLink = sidebar.querySelector('a[href="dashboard.html"]');
            if (dashLink) dashLink.classList.add('active');
        }
    }
}

// Toast Helper for Redirects
window.showToastAfterRedirect = function (message, type = 'info', title = null) {
    localStorage.setItem('pendingToast', JSON.stringify({ message, type, title }));
};

document.addEventListener('DOMContentLoaded', () => {
    // Check for pending toast
    const pending = localStorage.getItem('pendingToast');
    if (pending) {
        try {
            const { message, type, title } = JSON.parse(pending);
            // Small delay to let page settle
            setTimeout(() => window.showToast(message, type, title), 300);
            localStorage.removeItem('pendingToast');
        } catch (e) {
            console.error('Error parsing pending toast', e);
            localStorage.removeItem('pendingToast');
        }
    }

    initSidebar();
    initUserMenu();
    initBackground();
});

// Background Injector
function initBackground() {
    if (!document.querySelector('.blob-container')) {
        const container = document.createElement('div');
        container.className = 'blob-container';
        container.innerHTML = `
            <div class="blob blob-1"></div>
            <div class="blob blob-2"></div>
            <div class="blob blob-3"></div>
        `;
        document.body.prepend(container);
    }
}

// Shared User Menu Logic & Notifications
function initUserMenu() {
    const userMenuContainer = document.querySelector('.user-menu-container');

    // Inject Notification Bell if not exists
    if (userMenuContainer && !document.getElementById('notification-bell-btn')) {
        const bellBtn = document.createElement('button');
        bellBtn.id = 'notification-bell-btn';
        bellBtn.className = 'notification-bell-btn';
        bellBtn.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
            </svg>
            <div id="notification-badge" class="notification-badge"></div>
        `;
        bellBtn.onclick = () => window.location.href = 'notifications.html';

        // Insert before user menu button
        const userBtn = document.getElementById('user-menu-btn');
        if (userBtn) {
            userMenuContainer.insertBefore(bellBtn, userBtn);
        }
    }

    // Initialize Badge Count
    updateNotificationBadge();

    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');

    if (userMenuBtn && userDropdown) {
        // Remove existing listeners to be safe? 
        // Simpler to just add, assuming called once.

        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
            userMenuBtn.classList.toggle('active');
        });

        // Close when clicking outside
        document.addEventListener('click', () => {
            userDropdown.classList.remove('show');
            userMenuBtn.classList.remove('active');
        });

        userDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Logout handler - shared
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // Perform logout API call
            await API.post('/api/auth/logout', {});

            // Show Cinematic Loading with Message
            window.showLoadingAndRedirect('index.html', 'Logging Out...');
        });
    }
}

// Global Header Updater
function updateUserHeader(user) {
    if (!user) return;

    // Update Name
    const nameDisplay = document.getElementById('user-name-display');
    if (nameDisplay) {
        nameDisplay.textContent = user.fullName || user.name || 'User';
    }

    // Update Avatar
    if (user.avatar) {
        const profileIconDiv = document.querySelector('.profile-icon');
        if (profileIconDiv) {
            profileIconDiv.innerHTML = `<img src="${user.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        }
    }
}

// Helper to update badge
async function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    try {
        const res = await API.get('/api/notifications/unread-count');
        if (res && res.count > 0) {
            badge.classList.add('show');
        } else {
            badge.classList.remove('show');
        }
    } catch (e) {
        console.error('Failed to update notification badge', e);
    }
}

// Loading Overlay Helper
// Loading Overlay Helper - Cinematic
window.showLoadingAndRedirect = function (destinationUrl, message = '') {
    // Check if overlay exists
    let overlay = document.getElementById('loading-overlay');

    // Remove any interfering notifications
    const toastContainer = document.querySelector('.toast-container');
    if (toastContainer) toastContainer.remove();
    const alertOverlay = document.querySelector('.custom-alert-overlay');
    if (alertOverlay) alertOverlay.remove();

    // Always recreate or update to ensure structure matches
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        document.body.appendChild(overlay);
    }

    // Inject Cinematic Structure
    overlay.innerHTML = `
        <div class="loader-wrapper">
            <div class="loader-ring"></div>
            <div class="loader-ring inner"></div>
            <img src="assets/logo-icon.png" alt="Loading" class="loading-logo">
        </div>
        ${message ? `<div class="loading-msg" style="position:absolute; bottom:20%; color:#fff; font-size:1.2rem; font-weight:600; text-shadow:0 0 10px rgba(0,229,255,0.5);">${message}</div>` : ''}
    `;

    // Activate
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });

    // Wait 3 seconds then redirect
    setTimeout(() => {
        window.location.href = destinationUrl;
    }, 3000);
};

// Password Toggle Logic
function setupPasswordToggles() {
    const icons = document.querySelectorAll('.password-toggle-icon');

    icons.forEach(icon => {
        icon.addEventListener('click', () => {
            const input = icon.previousElementSibling;
            if (input && input.tagName === 'INPUT') {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);

                // Toggle Icon
                if (type === 'text') {
                    // Show "Hide" icon (Slash)
                    icon.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;
                } else {
                    // Show "Show" icon (Eye)
                    icon.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
                }
            }
        });
    });
}

// Init when DOM loads
document.addEventListener('DOMContentLoaded', setupPasswordToggles);
