// Settings modal component

import { getSyncSettings, saveSyncSettings, getInputMode } from '../services/storage.js';
import { isBrowserSyncSupported, syncToGitHub } from '../services/sync.js';
import { updateInputMode } from './capture-area.js';
import { generateMarkdownAll, downloadFile } from '../utils/markdown.js';
import { getThoughts, getUnsyncedCount } from '../services/storage.js';
import { getToday, getDateFromISO } from '../utils/datetime.js';
import { APP_VERSION, GIT_HASH, BUILD_DATE } from '../version.js';

export function openSettings() {
    const modal = document.getElementById('settingsModal');

    // Load input mode
    document.getElementById('inputMode').value = getInputMode();

    // Load sync settings
    const syncSettings = getSyncSettings();
    if (syncSettings) {
        document.getElementById('githubToken').value = syncSettings.token || '';
        document.getElementById('githubRepo').value = syncSettings.repo || '';
        document.getElementById('githubPath').value = syncSettings.path || 'Daily Notes/{date}.md';
        document.getElementById('syncMode').value = syncSettings.syncMode || 'auto';
    }

    // Update help text based on browser support
    const helpText = document.getElementById('syncModeHelp');
    if (isBrowserSyncSupported()) {
        helpText.innerHTML = 'Auto mode uses Background Sync API (syncs even when app is backgrounded)';
    } else {
        helpText.innerHTML = '⚠️ Background Sync not supported on this device (iOS/Safari). Auto mode will sync immediately instead.';
    }

    // Show version
    document.getElementById('versionDisplay').textContent = `Version ${APP_VERSION}`;

    modal.classList.add('show');
}

export function closeSettings() {
    document.getElementById('settingsModal').classList.remove('show');
}

export async function saveSettings() {
    const newInputMode = document.getElementById('inputMode').value;
    const token = document.getElementById('githubToken').value.trim();
    const repo = document.getElementById('githubRepo').value.trim();
    const path = document.getElementById('githubPath').value.trim();
    const syncMode = document.getElementById('syncMode').value;

    // Update input mode
    const captureContainer = document.querySelector('.capture-area');
    updateInputMode(newInputMode, captureContainer);

    // Save sync settings if filled
    if (token && repo && path) {
        const syncSettings = { token, repo, path, syncMode };
        saveSyncSettings(syncSettings);
        updateSyncBanner();

        // Register service worker if auto mode
        if (syncMode === 'auto' && 'serviceWorker' in navigator) {
            await registerServiceWorker();
            console.log('[App] Service Worker registration requested');
        }

        // Try to sync immediately
        if (getUnsyncedCount() > 0) {
            syncToGitHub((progress) => {
                if (progress.type === 'sync_complete') {
                    showToast(`Synced ${progress.count} thoughts ✓`);
                }
            });
        }
    }

    closeSettings();
    showToast('Settings saved ✓');
}

export function exportAll() {
    const thoughts = getThoughts();

    if (!thoughts.length) {
        showToast('No thoughts to export');
        return;
    }

    // Group by date
    const byDate = {};
    thoughts.forEach(t => {
        const date = getDateFromISO(t.timestamp);
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(t);
    });

    const md = generateMarkdownAll(byDate);
    const today = getToday();
    downloadFile(`thoughts-export-${today}.md`, md);
    showToast('Exported ✓');
}

export function manualSync() {
    syncToGitHub((progress) => {
        if (progress.type === 'syncing') {
            showToast('Syncing...');
        } else if (progress.type === 'sync_complete') {
            showToast(`Synced ${progress.count} thoughts ✓`);
        } else if (progress.type === 'already_synced') {
            showToast('Already synced ✓');
        } else if (progress.type === 'sync_failed') {
            showToast(`Sync failed: ${progress.error}`);
        }

        // Update status display
        const event = new CustomEvent('statusUpdate');
        window.dispatchEvent(event);
    });
}

function updateSyncBanner() {
    const banner = document.getElementById('syncBanner');
    const syncSettings = getSyncSettings();
    if (!syncSettings) {
        banner.style.display = 'flex';
    } else {
        banner.style.display = 'none';
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

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
}

// Initialize sync banner on load
export function initSyncBanner() {
    updateSyncBanner();
}
