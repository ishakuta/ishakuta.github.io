// Geocoding service using Nominatim (OpenStreetMap)
// Converts coordinates to human-readable location names

const GEOCODE_CACHE_KEY = 'geocode_cache';
const PENDING_GEOCODES_KEY = 'pending_geocodes';
const RATE_LIMIT_DELAY = 1100; // 1.1 seconds (to stay under 1 req/sec)

let lastRequestTime = 0;
const geocodeQueue = [];
let isProcessing = false;

// Round coordinates to 2 decimal places for caching
// This creates ~1km granularity (good for city-level caching)
function roundCoordinate(coord) {
    return Math.round(parseFloat(coord) * 100) / 100;
}

function getCacheKey(lat, lon) {
    return `${roundCoordinate(lat)},${roundCoordinate(lon)}`;
}

// Get cached geocode results
function getGeocodeCache() {
    const cached = localStorage.getItem(GEOCODE_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
}

function saveGeocodeCache(cache) {
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
}

// Get pending geocode IDs (thoughts waiting for geocoding)
function getPendingGeocodes() {
    const pending = localStorage.getItem(PENDING_GEOCODES_KEY);
    return pending ? JSON.parse(pending) : [];
}

function savePendingGeocodes(pending) {
    localStorage.setItem(PENDING_GEOCODES_KEY, JSON.stringify(pending));
}

function addPendingGeocode(thoughtId) {
    const pending = getPendingGeocodes();
    if (!pending.includes(thoughtId)) {
        pending.push(thoughtId);
        savePendingGeocodes(pending);
    }
}

function removePendingGeocode(thoughtId) {
    const pending = getPendingGeocodes();
    const filtered = pending.filter(id => id !== thoughtId);
    savePendingGeocodes(filtered);
}

// Check if there are any pending geocode requests
export function hasPendingGeocodes() {
    return getPendingGeocodes().length > 0;
}

// Wait for all pending geocodes to complete
export async function waitForPendingGeocodes(timeout = 10000) {
    const startTime = Date.now();

    while (hasPendingGeocodes()) {
        if (Date.now() - startTime > timeout) {
            console.warn('[Geocode] Timeout waiting for pending geocodes');
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Reverse geocode coordinates to location name
// eslint-disable-next-line complexity -- Geocoding logic requires multiple conditional branches
async function reverseGeocode(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'ThoughtCapturePWA/1.0 (https://shakuta.dev/thoughts/)'
            }
        });

        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.status}`);
        }

        const data = await response.json();

        // Extract location name (prefer city, fallback to town/village/county)
        const name = data.address?.city
            || data.address?.town
            || data.address?.village
            || data.address?.municipality
            || data.address?.county
            || null;

        const country = data.address?.country || null;

        // Return combined name (e.g., "Warsaw, Poland")
        if (name && country) {
            return `${name}, ${country}`;
        } else if (name) {
            return name;
        } else if (country) {
            return country;
        }

        return null;
    } catch (err) {
        console.error('[Geocode] Reverse geocoding failed:', err);
        return null;
    }
}

// Process geocode queue with rate limiting
async function processGeocodeQueue() {
    if (isProcessing || geocodeQueue.length === 0) {
        return;
    }

    isProcessing = true;

    while (geocodeQueue.length > 0) {
        const { lat, lon, thoughtId, resolve } = geocodeQueue.shift();

        // Respect rate limit (1 request per second)
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;

        if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
            const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
            await new Promise(r => setTimeout(r, delay));
        }

        // Check cache first
        const cacheKey = getCacheKey(lat, lon);
        const cache = getGeocodeCache();

        let locationName = cache[cacheKey];

        if (!locationName) {
            // Not in cache - fetch from API
            console.log(`[Geocode] Fetching location for ${lat}, ${lon}`);
            locationName = await reverseGeocode(lat, lon);
            lastRequestTime = Date.now();

            // Cache result (even if null, to avoid repeated failed requests)
            if (locationName) {
                cache[cacheKey] = locationName;
                saveGeocodeCache(cache);
                console.log(`[Geocode] Cached: ${cacheKey} → ${locationName}`);
            }
        } else {
            console.log(`[Geocode] Cache hit: ${cacheKey} → ${locationName}`);
        }

        // Remove from pending
        removePendingGeocode(thoughtId);

        resolve(locationName);
    }

    isProcessing = false;
}

// Geocode a thought's location (async, non-blocking)
export async function geocodeThought(thought, onComplete) {
    if (!thought.location || !thought.location.lat || !thought.location.lon) {
        return;
    }

    // Check if already has location name
    if (thought.location.name) {
        return;
    }

    // Add to pending list
    addPendingGeocode(thought.id);

    // Add to queue
    return new Promise((resolve) => {
        geocodeQueue.push({
            lat: thought.location.lat,
            lon: thought.location.lon,
            thoughtId: thought.id,
            resolve: (locationName) => {
                if (locationName) {
                    thought.location.name = locationName;
                }
                if (onComplete) {
                    onComplete(thought, locationName);
                }
                resolve(locationName);
            }
        });

        // Start processing queue
        processGeocodeQueue();
    });
}

// Clear geocode cache (for debugging)
export function clearGeocodeCache() {
    localStorage.removeItem(GEOCODE_CACHE_KEY);
    localStorage.removeItem(PENDING_GEOCODES_KEY);
    console.log('[Geocode] Cache cleared');
}
