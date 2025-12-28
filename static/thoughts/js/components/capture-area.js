// Capture area component

import { addThought, getSyncSettings, getInputMode, saveInputMode, saveThoughts, getThoughts } from '../services/storage.js';
import { queueSync } from '../services/sync.js';
import { renderThoughtsList } from './thoughts-list.js';
import { geocodeThought } from '../services/geocoding.js';

let currentLocation = null;
let inputMode = 'multiline';

export function initCaptureArea(container, onCaptured) {
    inputMode = getInputMode();
    renderCaptureInput(container);
    requestLocation();
}

function renderCaptureInput(container) {
    const existingInput = container.querySelector('#thoughtInput');
    const currentValue = existingInput ? existingInput.value : '';

    // Remove old input if exists
    if (existingInput) {
        existingInput.remove();
    }

    // Create new input based on mode
    let newInput;
    if (inputMode === 'single') {
        newInput = document.createElement('input');
        newInput.type = 'text';
        newInput.className = 'thought-input';
        newInput.id = 'thoughtInput';
        newInput.placeholder = "What's on your mind? (Press Enter to capture)";
        newInput.autofocus = true;
        newInput.value = currentValue;

        // Enter key captures
        newInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                captureThought();
            }
        });
    } else {
        newInput = document.createElement('textarea');
        newInput.id = 'thoughtInput';
        newInput.placeholder = "What's on your mind?";
        newInput.autofocus = true;
        newInput.value = currentValue;

        // Cmd/Ctrl+Enter captures
        newInput.addEventListener('keydown', e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                captureThought();
            }
        });
    }

    // Insert before actions div
    const actionsDiv = container.querySelector('.actions');
    container.insertBefore(newInput, actionsDiv);
    newInput.focus();
}

export function updateInputMode(newMode, container) {
    if (newMode !== inputMode) {
        inputMode = newMode;
        saveInputMode(inputMode);
        renderCaptureInput(container);
    }
}

function requestLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                currentLocation = {
                    lat: pos.coords.latitude.toFixed(5),
                    lon: pos.coords.longitude.toFixed(5)
                };
            },
            err => {
                // Location not available
            },
            { enableHighAccuracy: false, timeout: 5000 }
        );
    }
}

function captureThought() {
    const input = document.getElementById('thoughtInput');
    const text = input.value.trim();

    if (!text) return;

    const thought = {
        id: Date.now(),
        text,
        timestamp: new Date().toISOString(),
        location: currentLocation,
        synced: false
    };

    addThought(thought);
    input.value = '';

    // Render updated list
    const listContainer = document.getElementById('thoughtsList');
    if (listContainer) {
        renderThoughtsList(listContainer);
    }

    // Show toast
    showToast('Captured ✓');

    // Haptic feedback
    if ('vibrate' in navigator) {
        navigator.vibrate(10);
    }

    // Geocode location (async, non-blocking)
    if (thought.location) {
        geocodeThought(thought, (updatedThought, locationName) => {
            if (locationName) {
                // Update thought in storage with location name
                const thoughts = getThoughts();
                const index = thoughts.findIndex(t => t.id === updatedThought.id);
                if (index !== -1) {
                    thoughts[index] = updatedThought;
                    saveThoughts(thoughts);

                    // Re-render list to show location name
                    if (listContainer) {
                        renderThoughtsList(listContainer);
                    }

                    console.log(`[Geocode] Updated thought ${updatedThought.id} with location: ${locationName}`);
                }
            }
        });
    }

    // Queue for sync
    const syncSettings = getSyncSettings();
    if (syncSettings && syncSettings.syncMode === 'auto') {
        queueSync((progress) => {
            updateStatus(progress);
        });
    }

    // Update status
    updateStatusDisplay();
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
}

function updateStatus(progress) {
    // Handle sync progress updates
    if (progress.type === 'sync_complete') {
        showToast(`Synced ${progress.count} thoughts ✓`);
    } else if (progress.type === 'sync_failed') {
        showToast(`Sync failed: ${progress.error}`);
    }
    updateStatusDisplay();
}

function updateStatusDisplay() {
    // This will be called from app.js
    const event = new CustomEvent('statusUpdate');
    window.dispatchEvent(event);
}

// Export capture function for button click
export { captureThought };
