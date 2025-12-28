// GitHub sync service

import { getThoughts, saveThoughts, getSyncSettings, getUnsyncedThoughts, markAllAsSynced } from './storage.js';
import { parseMarkdownThoughts, thoughtToMarkdown } from '../utils/markdown.js';
import { getToday, getDateFromISO } from '../utils/datetime.js';
import { hasPendingGeocodes, waitForPendingGeocodes } from './geocoding.js';
import { isEnabled } from '../utils/feature-flags.js';

export function isBrowserSyncSupported() {
    return 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype;
}

// Fetch today's thoughts from GitHub (two-way sync)
// TODO: Implement multi-day sync scanning (currently only syncs today)
// eslint-disable-next-line max-lines-per-function -- Two-way sync logic is inherently multi-step
export async function syncFromGitHub(onProgress) {
    const syncSettings = getSyncSettings();
    if (!syncSettings) {
        return;
    }

    try {
        const today = getToday();
        const path = syncSettings.path.replace('{date}', today);
        const { token, repo } = syncSettings;

        const getUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
        const getResp = await fetch(getUrl, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!getResp.ok) {
            // File doesn't exist yet (no thoughts on GitHub for today)
            console.log('[Sync] No thoughts found on GitHub for today');
            return;
        }

        const data = await getResp.json();
        const content = decodeURIComponent(escape(atob(data.content)));

        // Parse thoughts from markdown
        const githubThoughts = parseMarkdownThoughts(content, today);

        if (githubThoughts.length === 0) {
            console.log('[Sync] No parseable thoughts in GitHub file');
            return;
        }

        // Merge with local thoughts
        const localThoughts = getThoughts();
        const merged = [...localThoughts];

        // Add GitHub thoughts that don't exist locally (based on timestamp)
        githubThoughts.forEach(gitThought => {
            const exists = localThoughts.some(local =>
                local.timestamp === gitThought.timestamp
            );

            if (!exists) {
                merged.push(gitThought);
                console.log('[Sync] Added thought from GitHub:', gitThought.timestamp);
            } else {
                // Thought exists locally - check if it's the same or a conflict
                const local = localThoughts.find(l => l.timestamp === gitThought.timestamp);
                if (local.text !== gitThought.text) {
                    // Conflict: same timestamp, different text
                    // Keep both by adding GitHub version with slightly offset timestamp
                    gitThought.id = gitThought.id + 1;
                    gitThought.timestamp = new Date(new Date(gitThought.timestamp).getTime() + 1000).toISOString();
                    merged.push(gitThought);
                    console.log('[Sync] Conflict detected, kept both thoughts:', gitThought.timestamp);
                }
            }
        });

        // Sort merged thoughts by timestamp (newest first)
        merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Save merged and sorted thoughts
        saveThoughts(merged);

        console.log(`[Sync] Synced ${githubThoughts.length} thoughts from GitHub`);

        if (onProgress) {
            onProgress({
                type: 'download_complete',
                count: githubThoughts.length
            });
        }
    } catch (err) {
        console.error('[Sync] Failed to sync from GitHub:', err);
        throw err;
    }
}

// eslint-disable-next-line complexity -- Sync logic requires validation, grouping, and error handling
export async function syncToGitHub(onProgress) {
    const syncSettings = getSyncSettings();
    if (!syncSettings) {
        throw new Error('Sync settings not configured');
    }

    // Wait for pending geocodes to complete (with 10s timeout)
    if (isEnabled('geocoding') && hasPendingGeocodes()) {
        console.log('[Sync] Waiting for geocoding to complete...');
        if (onProgress) {
            onProgress({ type: 'waiting_geocoding' });
        }
        await waitForPendingGeocodes(10000);
    }

    const unsynced = getUnsyncedThoughts();

    if (unsynced.length === 0) {
        if (onProgress) {
            onProgress({ type: 'already_synced' });
        }
        return;
    }

    if (onProgress) {
        onProgress({ type: 'syncing', count: unsynced.length });
    }

    try {
        // Group by date
        const byDate = {};
        unsynced.forEach(t => {
            const date = getDateFromISO(t.timestamp);
            if (!byDate[date]) byDate[date] = [];
            byDate[date].push(t);
        });

        // Sync each date
        for (const date of Object.keys(byDate)) {
            const dayThoughts = byDate[date];
            await syncDayToGitHub(date, dayThoughts, syncSettings);
        }

        // Mark as synced
        markAllAsSynced();

        if (onProgress) {
            onProgress({ type: 'sync_complete', count: unsynced.length });
        }
    } catch (err) {
        console.error('[Sync] Sync failed:', err);
        if (onProgress) {
            onProgress({ type: 'sync_failed', error: err.message });
        }
        throw err;
    }
}

async function syncDayToGitHub(date, dayThoughts, syncSettings) {
    const path = syncSettings.path.replace('{date}', date);
    const { token, repo } = syncSettings;

    // Get existing file content
    const getUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
    let existingContent = '';
    let sha = null;

    try {
        const getResp = await fetch(getUrl, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (getResp.ok) {
            const data = await getResp.json();
            // Properly decode UTF-8 from base64
            existingContent = decodeURIComponent(escape(atob(data.content)));
            sha = data.sha;
        }
    } catch (err) {
        // File doesn't exist, will create new
    }

    // Generate markdown for new thoughts
    let newContent = '';
    dayThoughts.reverse().forEach(t => {
        newContent += thoughtToMarkdown(t) + '\n\n';
    });

    // Append to existing or create new
    let finalContent;
    if (existingContent) {
        // Append to existing file
        finalContent = existingContent.trimEnd() + '\n\n' + newContent;
    } else {
        // Create new file with header
        finalContent = `# Thoughts - ${date}\n\n${newContent}`;
    }

    // Commit to GitHub
    const putUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
    const commitMessage = `Add ${dayThoughts.length} thought(s) - ${date}`;

    const putResp = await fetch(putUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: commitMessage,
            // Properly encode UTF-8 to base64
            content: btoa(unescape(encodeURIComponent(finalContent))),
            sha: sha
        })
    });

    if (!putResp.ok) {
        const error = await putResp.json();
        throw new Error(error.message || 'GitHub API error');
    }
}

export function queueSync(onProgress) {
    // Use Background Sync if available
    if (isBrowserSyncSupported()) {
        console.log('[Sync] Using Background Sync API');
        navigator.serviceWorker.ready.then(registration => {
            return registration.sync.register('sync-thoughts');
        }).then(() => {
            console.log('[Sync] Background sync registered');
            if (onProgress) {
                onProgress({ type: 'queued' });
            }
        }).catch(err => {
            console.log('[Sync] Background sync failed, using immediate sync:', err);
            syncToGitHub(onProgress);
        });
    } else {
        // Fallback to immediate sync (iOS, old browsers)
        console.log('[Sync] Background Sync not supported, using immediate sync');
        syncToGitHub(onProgress);
    }
}
