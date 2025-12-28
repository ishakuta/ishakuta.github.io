// Markdown generation and parsing utilities

import { formatTime } from './datetime.js';
import { getMapsUrl } from './location.js';

export function thoughtToMarkdown(thought) {
    const time = formatTime(thought.timestamp);

    let locationStr = '';
    if (thought.location) {
        const mapsUrl = getMapsUrl(thought.location.lat, thought.location.lon);
        const coords = `${thought.location.lat}, ${thought.location.lon}`;

        if (thought.location.name) {
            // Show location name with coords in link
            locationStr = ` | 📍 ${thought.location.name} | [${coords}](${mapsUrl})`;
        } else {
            // Show only coords as link
            locationStr = ` | 📍 [${coords}](${mapsUrl})`;
        }
    }

    return `- **${time}**${locationStr}\n  ${thought.text.replace(/\n/g, '\n  ')}`;
}

export function generateMarkdown(thoughts, date) {
    let md = `# Thoughts - ${date}\n\n`;
    thoughts.reverse().forEach(t => {
        md += thoughtToMarkdown(t) + '\n\n';
    });
    return md;
}

export function generateMarkdownAll(thoughtsByDate) {
    let md = '# Captured Thoughts\n\n';
    Object.keys(thoughtsByDate).sort().reverse().forEach(date => {
        md += `## ${date}\n\n`;
        thoughtsByDate[date].reverse().forEach(t => {
            md += thoughtToMarkdown(t) + '\n\n';
        });
    });
    return md;
}

export function parseMarkdownThoughts(markdown, date) {
    const thoughts = [];
    // Match thought entries: - **HH:MM** | optional location\n  text
    const thoughtPattern = /^-\s+\*\*(\d{2}:\d{2})\*\*(?:\s+\|\s+📍\s+\[([0-9.-]+),\s+([0-9.-]+)\])?(?:\s*\([^)]+\))?\s*\n\s+(.+?)(?=\n-\s+\*\*|\n#|\n\n|$)/gms;

    let match;
    while ((match = thoughtPattern.exec(markdown)) !== null) {
        const [, time, lat, lon, text] = match;

        // Reconstruct ISO timestamp from date and time
        const timestamp = `${date}T${time}:00.000Z`;

        // Create thought object
        const thought = {
            id: new Date(timestamp).getTime(),
            text: text.trim().replace(/\n\s+/g, '\n'), // Preserve multiline
            timestamp: timestamp,
            synced: true // Mark as synced since it came from GitHub
        };

        // Add location if present
        if (lat && lon) {
            thought.location = { lat, lon };
        }

        thoughts.push(thought);
    }

    return thoughts;
}

export function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    // Append to DOM (required for Firefox and some Windows browsers)
    a.style.display = 'none';
    document.body.appendChild(a);

    // Trigger download
    a.click();

    // Clean up - delay revocation to ensure download starts
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}
