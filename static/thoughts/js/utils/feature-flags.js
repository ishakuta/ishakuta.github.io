// Feature Flags System
// 3-tier approach: Query params, Console API, Settings UI

const FEATURE_FLAGS_KEY = 'feature_flags';
const EXPERIMENTAL_MODE_KEY = 'experimental_mode';

// Feature definitions
const FEATURES = {
    // Stable features (always on)
    STABLE: {
        capture: true,
        export: true,
        sync: true,
        location_coords: true,  // Basic location (coordinates only)
    },

    // Experimental features (off by default, can be enabled)
    EXPERIMENTAL: {
        geocoding: false,              // Location names (Nominatim API)
        voice_capture: false,          // Voice input (future)
        tags: false,                   // #tag support (future)
        search: false,                 // Full-text search (future)
        two_way_sync_multi_day: false, // Multi-day sync (future)
    }
};

// Get feature flags from localStorage
function getStoredFlags() {
    const stored = localStorage.getItem(FEATURE_FLAGS_KEY);
    return stored ? JSON.parse(stored) : {};
}

// Save feature flags to localStorage
function saveFlags(flags) {
    localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(flags));
}

// Check if experimental mode is enabled
export function isExperimentalMode() {
    return localStorage.getItem(EXPERIMENTAL_MODE_KEY) === 'true';
}

// Enable experimental mode
function enableExperimentalMode() {
    localStorage.setItem(EXPERIMENTAL_MODE_KEY, 'true');
    console.log('[FeatureFlags] 🧪 Experimental mode enabled');
}

// Disable experimental mode
function disableExperimentalMode() {
    localStorage.setItem(EXPERIMENTAL_MODE_KEY, 'false');
    // Also disable all experimental features
    const flags = getStoredFlags();
    Object.keys(FEATURES.EXPERIMENTAL).forEach(key => {
        flags[key] = false;
    });
    saveFlags(flags);
    console.log('[FeatureFlags] Experimental mode disabled');
}

// Check if a feature is enabled
export function isEnabled(featureName) {
    // Check stable features first (always on)
    if (FEATURES.STABLE[featureName] === true) {
        return true;
    }

    // Check experimental features
    if (featureName in FEATURES.EXPERIMENTAL) {
        const storedFlags = getStoredFlags();
        return storedFlags[featureName] === true;
    }

    // Unknown feature - default to false
    console.warn(`[FeatureFlags] Unknown feature: ${featureName}`);
    return false;
}

// Enable a feature
export function enable(featureName) {
    if (featureName in FEATURES.EXPERIMENTAL) {
        const flags = getStoredFlags();
        flags[featureName] = true;
        saveFlags(flags);
        console.log(`[FeatureFlags] ✓ Enabled: ${featureName}`);
        return true;
    } else if (featureName in FEATURES.STABLE) {
        console.warn(`[FeatureFlags] Feature "${featureName}" is stable and always enabled`);
        return false;
    } else {
        console.error(`[FeatureFlags] Unknown feature: ${featureName}`);
        return false;
    }
}

// Disable a feature
export function disable(featureName) {
    if (featureName in FEATURES.EXPERIMENTAL) {
        const flags = getStoredFlags();
        flags[featureName] = false;
        saveFlags(flags);
        console.log(`[FeatureFlags] ✗ Disabled: ${featureName}`);
        return true;
    } else if (featureName in FEATURES.STABLE) {
        console.warn(`[FeatureFlags] Cannot disable stable feature: ${featureName}`);
        return false;
    } else {
        console.error(`[FeatureFlags] Unknown feature: ${featureName}`);
        return false;
    }
}

// List all features and their status
export function list() {
    console.log('[FeatureFlags] 📋 Feature Status:');
    console.log('\n🟢 Stable (always on):');
    Object.keys(FEATURES.STABLE).forEach(key => {
        console.log(`  ✓ ${key}`);
    });

    console.log('\n🧪 Experimental:');
    const flags = getStoredFlags();
    Object.keys(FEATURES.EXPERIMENTAL).forEach(key => {
        const enabled = flags[key] === true;
        console.log(`  ${enabled ? '✓' : '✗'} ${key}`);
    });

    console.log(`\n🔬 Experimental mode: ${isExperimentalMode() ? 'ON' : 'OFF'}`);
}

// Get all experimental features and their status
export function getExperimentalFeatures() {
    const flags = getStoredFlags();
    return Object.keys(FEATURES.EXPERIMENTAL).map(key => ({
        name: key,
        enabled: flags[key] === true,
        description: getFeatureDescription(key)
    }));
}

// Get feature description
function getFeatureDescription(featureName) {
    const descriptions = {
        geocoding: 'Location names (e.g., "Warsaw, Poland")',
        voice_capture: 'Voice input for thoughts',
        tags: 'Support for #hashtags',
        search: 'Full-text search',
        two_way_sync_multi_day: 'Multi-day sync scanning'
    };
    return descriptions[featureName] || featureName;
}

// Parse query parameters and apply feature flags
export function initFromQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const ff = params.get('ff');

    if (!ff) {
        return; // No feature flags in URL
    }

    if (ff === 'off') {
        // Disable experimental mode
        disableExperimentalMode();
        console.log('[FeatureFlags] All experimental features disabled');

        // Remove query param from URL
        window.history.replaceState({}, '', window.location.pathname);
        return;
    }

    if (ff === 'experimental' || ff === 'all') {
        // Enable experimental mode and all experimental features
        enableExperimentalMode();
        const flags = getStoredFlags();
        Object.keys(FEATURES.EXPERIMENTAL).forEach(key => {
            flags[key] = true;
        });
        saveFlags(flags);
        console.log('[FeatureFlags] 🧪 All experimental features enabled');
    } else {
        // Enable specific features (comma-separated)
        enableExperimentalMode();
        const features = ff.split(',').map(f => f.trim());
        features.forEach(feature => {
            if (feature in FEATURES.EXPERIMENTAL) {
                enable(feature);
            } else {
                console.warn(`[FeatureFlags] Unknown feature in URL: ${feature}`);
            }
        });
    }

    // Remove query param from URL (keep it clean)
    window.history.replaceState({}, '', window.location.pathname);
}

// Expose to global scope for console access
window.featureFlags = {
    enable,
    disable,
    list,
    isEnabled,
    experimental: () => {
        enableExperimentalMode();
        console.log('[FeatureFlags] 🧪 Experimental mode enabled. Use featureFlags.list() to see available features.');
    },
    stable: () => {
        disableExperimentalMode();
        console.log('[FeatureFlags] Experimental mode disabled');
    }
};

// Initialize on load
initFromQueryParams();

console.log('[FeatureFlags] Initialized. Type featureFlags.list() to see all features.');
