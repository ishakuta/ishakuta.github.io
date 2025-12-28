// Settings modal component

import { getSyncSettings, saveSyncSettings, getInputMode } from '../services/storage.js';
import { isBrowserSyncSupported, syncToGitHub } from '../services/sync.js';
import { updateInputMode } from './capture-area.js';
import { generateMarkdownAll, downloadFile } from '../utils/markdown.js';
import { getThoughts, getUnsyncedCount } from '../services/storage.js';
import { getToday, getDateFromISO } from '../utils/datetime.js';
import { APP_VERSION, GIT_HASH } from '../version.js';
import { isExperimentalMode, getExperimentalFeatures, enable as enableFeature, disable as disableFeature } from '../utils/feature-flags.js';

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
        document.getElementById('githubBranch').value = syncSettings.branch || 'main';
        document.getElementById('syncMode').value = syncSettings.syncMode || 'auto';
    }

    // Update help text based on browser support
    const helpText = document.getElementById('syncModeHelp');
    if (isBrowserSyncSupported()) {
        helpText.innerHTML = 'Auto mode uses Background Sync API (syncs even when app is backgrounded)';
    } else {
        helpText.innerHTML = '⚠️ Background Sync not supported on this device (iOS/Safari). Auto mode will sync immediately instead.';
    }

    // Show version with link to commit
    const versionEl = document.getElementById('versionDisplay');
    const repoUrl = 'https://github.com/ishakuta/ishakuta.github.io';
    versionEl.innerHTML = `Version <a href="${repoUrl}/commit/${GIT_HASH}" target="_blank" style="color: var(--accent); text-decoration: none;">${APP_VERSION}</a>`;

    // Show experimental features section if experimental mode is enabled
    const experimentalSection = document.getElementById('experimentalFeaturesSection');
    if (isExperimentalMode()) {
        experimentalSection.style.display = 'block';
        renderExperimentalFeatures();
    } else {
        experimentalSection.style.display = 'none';
    }

    modal.classList.add('show');
}

function renderExperimentalFeatures() {
    const container = document.getElementById('experimentalFeaturesList');
    const features = getExperimentalFeatures();

    container.innerHTML = '';

    features.forEach(feature => {
        const featureDiv = document.createElement('div');
        featureDiv.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);';

        const labelDiv = document.createElement('div');
        labelDiv.style.cssText = 'flex: 1;';

        const nameSpan = document.createElement('div');
        nameSpan.textContent = feature.name.replace(/_/g, ' ');
        nameSpan.style.cssText = 'font-size: 13px; font-weight: 500; text-transform: capitalize;';

        const descSpan = document.createElement('div');
        descSpan.textContent = feature.description;
        descSpan.style.cssText = 'font-size: 11px; color: var(--muted); margin-top: 2px;';

        labelDiv.appendChild(nameSpan);
        labelDiv.appendChild(descSpan);

        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = feature.enabled;
        toggle.dataset.featureName = feature.name;
        toggle.style.cssText = 'width: 40px; height: 20px; cursor: pointer;';

        featureDiv.appendChild(labelDiv);
        featureDiv.appendChild(toggle);
        container.appendChild(featureDiv);
    });
}

export function closeSettings() {
    document.getElementById('settingsModal').classList.remove('show');
}

export async function saveSettings() {
    const newInputMode = document.getElementById('inputMode').value;
    const token = document.getElementById('githubToken').value.trim();
    const repo = document.getElementById('githubRepo').value.trim();
    const path = document.getElementById('githubPath').value.trim();
    const branch = document.getElementById('githubBranch').value.trim() || 'main';
    const syncMode = document.getElementById('syncMode').value;

    // Update input mode
    const captureContainer = document.querySelector('.capture-area');
    updateInputMode(newInputMode, captureContainer);

    // Save experimental feature flags if experimental mode is enabled
    if (isExperimentalMode()) {
        const featureCheckboxes = document.querySelectorAll('#experimentalFeaturesList input[type="checkbox"]');
        featureCheckboxes.forEach(checkbox => {
            const featureName = checkbox.dataset.featureName;
            if (checkbox.checked) {
                enableFeature(featureName);
            } else {
                disableFeature(featureName);
            }
        });
    }

    // Save sync settings if filled
    if (token && repo && path) {
        const syncSettings = { token, repo, path, branch, syncMode };
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
