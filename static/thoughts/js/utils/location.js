// Location utility functions

// Google Maps URL template
const MAPS_URL_TEMPLATE = 'https://www.google.com/maps?q={lat},{lon}';

// Generate Google Maps URL from coordinates
export function getMapsUrl(lat, lon) {
    return MAPS_URL_TEMPLATE
        .replace('{lat}', lat)
        .replace('{lon}', lon);
}

// Format location for display
export function formatLocation(location) {
    if (!location) {
        return null;
    }

    const mapsUrl = getMapsUrl(location.lat, location.lon);
    const coords = `${location.lat}, ${location.lon}`;

    return {
        name: location.name || null,
        coords: coords,
        mapsUrl: mapsUrl
    };
}
