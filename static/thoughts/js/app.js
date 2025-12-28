// Thought Capture PWA - Main Application
// Entry point for the application

import './utils/feature-flags.js'; // Initialize feature flags (query params, console API)
import { initCaptureArea, captureThought } from './components/capture-area.js';
import { renderThoughtsList } from './components/thoughts-list.js';
import {
    openSettings,
    closeSettings,
    saveSettings,
    exportAll,
    manualSync,
    initSyncBanner
} from './components/settings-modal.js';
import { getSyncSettings, getUnsyncedCount } from './services/storage.js';
import { syncFromGitHub, syncToGitHub } from './services/sync.js';
import { generateMarkdown, downloadFile } from './utils/markdown.js';
import { getThoughts } from './services/storage.js';
import { getToday } from './utils/datetime.js';

// Initialize app
function init() {
    // Initialize capture area
    const captureContainer = document.querySelector('.capture-area');
    initCaptureArea(captureContainer);

    // Render initial thoughts list
    const listContainer = document.getElementById('thoughtsList');
    renderThoughtsList(listContainer);

    // Initialize sync banner
    initSyncBanner();

    // Setup event listeners
    setupEventListeners();

    // Update status
    updateStatus();

    // Register Service Worker on load
    if ('serviceWorker' in navigator) {
        registerServiceWorker();
    }

    // Two-way sync on load if auto-sync enabled
    const syncSettings = getSyncSettings();
    if (syncSettings && syncSettings.syncMode === 'auto') {
        console.log('[App] Two-way sync enabled, fetching thoughts from GitHub...');
        setTimeout(async () => {
            try {
                await syncFromGitHub((progress) => {
                    if (progress.type === 'download_complete') {
                        const listContainer = document.getElementById('thoughtsList');
                        renderThoughtsList(listContainer);
                        showToast(`Downloaded ${progress.count} thoughts from GitHub`);
                    }
                });

                // Then sync any unsynced local thoughts
                if (getUnsyncedCount() > 0) {
                    console.log('[App] Found unsynced thoughts on load, syncing to GitHub...');
                    await syncToGitHub((progress) => {
                        if (progress.type === 'sync_complete') {
                            updateStatus();
                        }
                    });
                }
            } catch (err) {
                console.error('[App] Auto-sync failed:', err);
            }
        }, 2000);
    }
}

function setupEventListeners() {
    // Capture button
    const captureBtn = document.querySelector('.btn-primary');
    if (captureBtn) {
        captureBtn.addEventListener('click', () => {
            captureThought();
        });
    }

    // Export today button
    const exportTodayBtn = document.querySelector('[onclick="exportToday()"]');
    if (exportTodayBtn) {
        exportTodayBtn.onclick = exportToday;
    }

    // Settings button
    const settingsBtn = document.querySelector('[onclick="openSettings()"]');
    if (settingsBtn) {
        settingsBtn.onclick = () => openSettings();
    }

    // Settings modal - close on background click
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                closeSettings();
            }
        });
    }

    // Settings modal buttons
    const closeBtn = document.querySelector('[onclick="closeSettings()"]');
    if (closeBtn) {
        closeBtn.onclick = () => closeSettings();
    }

    const saveBtn = document.querySelector('[onclick="saveSettings()"]');
    if (saveBtn) {
        saveBtn.onclick = () => saveSettings();
    }

    const exportAllBtn = document.querySelector('[onclick="exportAll()"]');
    if (exportAllBtn) {
        exportAllBtn.onclick = () => exportAll();
    }

    const syncNowBtn = document.querySelector('[onclick="manualSync()"]');
    if (syncNowBtn) {
        syncNowBtn.onclick = () => manualSync();
    }

    // Setup sync banner button
    const syncBannerBtn = document.querySelector('#syncBanner button');
    if (syncBannerBtn) {
        syncBannerBtn.onclick = () => openSettings();
    }

    // Update banner button
    const updateBannerBtn = document.querySelector('[onclick="reloadApp()"]');
    if (updateBannerBtn) {
        updateBannerBtn.onclick = reloadApp;
    }

    // Listen for Service Worker messages
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
            console.log('[App] Message from SW:', event.data);

            if (event.data.type === 'BACKGROUND_SYNC_REQUESTED') {
                console.log('[App] Background sync requested by SW');
                syncToGitHub((progress) => {
                    if (progress.type === 'sync_complete') {
                        const listContainer = document.getElementById('thoughtsList');
                        renderThoughtsList(listContainer);
                        updateStatus();
                    }
                });
            } else if (event.data.type === 'SW_UPDATED') {
                console.log('[App] Service Worker updated to:', event.data.version);
                showUpdateBanner();
            }
        });
    }

    // Listen for status updates
    window.addEventListener('statusUpdate', () => {
        updateStatus();
    });
}

function exportToday() {
    const thoughts = getThoughts();
    const today = getToday();
    const todayThoughts = thoughts.filter(t => t.timestamp.startsWith(today));

    if (!todayThoughts.length) {
        showToast('No thoughts today');
        return;
    }

    const md = generateMarkdown(todayThoughts, today);
    downloadFile(`thoughts-${today}.md`, md);
    showToast('Exported ✓');
}

function updateStatus() {
    const dot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    if (!dot || !statusText) return;

    dot.className = 'status-dot';

    const unsynced = getUnsyncedCount();
    if (unsynced > 0) {
        statusText.textContent = `${unsynced} queued`;
    } else {
        statusText.textContent = 'synced';
    }
}

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.log('[App] Service Worker not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/thoughts/sw.js');
        console.log('[App] Service Worker registered:', registration.scope);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[App] Service Worker update found, installing...');

            newWorker.addEventListener('statechange', () => {
                console.log('[App] Service Worker state:', newWorker.state);
                if (newWorker.state === 'activated') {
                    console.log('[App] New Service Worker activated');
                }
            });
        });

        // Check for updates every 5 minutes (when app is open)
        setInterval(() => {
            console.log('[App] Checking for Service Worker updates...');
            registration.update();
        }, 300000);

        return registration;
    } catch (err) {
        console.error('[App] Service Worker registration failed:', err);
        return null;
    }
}

function showUpdateBanner() {
    const banner = document.getElementById('updateBanner');
    if (banner) {
        banner.style.display = 'flex';
    }
}

function reloadApp() {
    console.log('[App] Reloading app to apply updates...');
    window.location.reload();
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
}

// Make functions available globally for inline onclick handlers (temporary)
window.captureThought = captureThought;
window.exportToday = exportToday;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveSettings = saveSettings;
window.exportAll = exportAll;
window.manualSync = manualSync;
window.reloadApp = reloadApp;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
