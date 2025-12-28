// LocalStorage service for thoughts and settings

const STORAGE_KEY = 'thoughts';
const SETTINGS_KEY = 'github_sync_settings';
const INPUT_MODE_KEY = 'input_mode';

export function getThoughts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

export function saveThoughts(thoughts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
}

export function addThought(thought) {
    const thoughts = getThoughts();
    thoughts.unshift(thought);
    saveThoughts(thoughts);
}

export function getUnsyncedThoughts() {
    return getThoughts().filter(t => !t.synced);
}

export function getUnsyncedCount() {
    return getUnsyncedThoughts().length;
}

export function markAllAsSynced() {
    const thoughts = getThoughts();
    thoughts.forEach(t => {
        if (!t.synced) t.synced = true;
    });
    saveThoughts(thoughts);
}

export function getSyncSettings() {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : null;
}

export function saveSyncSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getInputMode() {
    return localStorage.getItem(INPUT_MODE_KEY) || 'multiline';
}

export function saveInputMode(mode) {
    localStorage.setItem(INPUT_MODE_KEY, mode);
}
