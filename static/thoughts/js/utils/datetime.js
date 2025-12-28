// Date and time formatting utilities

export function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

export function getToday() {
    return new Date().toISOString().split('T')[0];
}

export function getDateFromISO(iso) {
    return iso.split('T')[0];
}
