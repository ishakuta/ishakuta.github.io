// Thoughts list component

import { getThoughts, getSyncSettings } from '../services/storage.js';
import { formatDate } from '../utils/datetime.js';

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getGitHubFileUrl(timestamp) {
    const syncSettings = getSyncSettings();
    if (!syncSettings || !syncSettings.repo) {
        return null;
    }

    const date = timestamp.split('T')[0]; // Extract YYYY-MM-DD
    const path = syncSettings.path.replace('{date}', date);
    const branch = syncSettings.branch || 'main';

    return `https://github.com/${syncSettings.repo}/blob/${branch}/${path}`;
}

export function renderThoughtsList(container) {
    const thoughts = getThoughts().slice(0, 10); // Show last 10

    if (!thoughts.length) {
        container.innerHTML = '<div class="empty-state">No thoughts yet. Start capturing!</div>';
        return;
    }

    container.innerHTML = thoughts.map(t => {
        const dateFormatted = formatDate(t.timestamp);
        const githubUrl = getGitHubFileUrl(t.timestamp);

        // Make date clickable if GitHub sync is configured
        const dateHtml = githubUrl
            ? `<a href="${githubUrl}" target="_blank" style="color: inherit; text-decoration: none; border-bottom: 1px dotted var(--muted);">${dateFormatted}</a>`
            : dateFormatted;

        return `
            <div class="thought-item ${t.synced ? 'synced' : ''}">
                <div class="thought-meta">
                    <span>${dateHtml}</span>
                    ${t.location ? `<span>📍 ${t.location.lat}, ${t.location.lon}</span>` : ''}
                </div>
                <div class="thought-text">${escapeHtml(t.text)}</div>
            </div>
        `;
    }).join('');
}
