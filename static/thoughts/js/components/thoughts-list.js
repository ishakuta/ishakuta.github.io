// Thoughts list component

import { getThoughts } from '../services/storage.js';
import { formatDate } from '../utils/datetime.js';

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function renderThoughtsList(container) {
    const thoughts = getThoughts().slice(0, 10); // Show last 10

    if (!thoughts.length) {
        container.innerHTML = '<div class="empty-state">No thoughts yet. Start capturing!</div>';
        return;
    }

    container.innerHTML = thoughts.map(t => `
        <div class="thought-item ${t.synced ? 'synced' : ''}">
            <div class="thought-meta">
                <span>${formatDate(t.timestamp)}</span>
                ${t.location ? `<span>📍 ${t.location.lat}, ${t.location.lon}</span>` : ''}
            </div>
            <div class="thought-text">${escapeHtml(t.text)}</div>
        </div>
    `).join('');
}
