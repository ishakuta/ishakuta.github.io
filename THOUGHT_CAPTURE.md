# Thought Capture PWA

A minimal Progressive Web App for capturing random thoughts on the go. Exports to Obsidian-compatible markdown with optional GitHub sync.

**Live at:** [https://shakuta.dev/thoughts/](https://shakuta.dev/thoughts/)

**Version:** 1.0.0

---

## Goal

Capture fleeting thoughts instantly without friction. When an idea hits, open the app, type, capture. No login required, no cloud dependency, all data stays on your device until you choose to export or sync.

---

## Core Principles

- **KISS** - Single HTML file, no build step, no dependencies
- **MVP** - Capture, store, export. Nothing else.
- **Speed** - Sub-second to first keystroke
- **Offline-first** - Works without internet (localStorage + Service Worker)
- **Privacy** - All data stays on device until you export or sync

---

## Features

| Feature | Status |
|---------|--------|
| Quick text capture | ✅ |
| Auto datetime (ISO) | ✅ |
| Geolocation (optional) | ✅ |
| LocalStorage persistence | ✅ |
| Input mode toggle (single/multi-line) | ✅ |
| Keyboard shortcuts | ✅ |
| Export today → .md | ✅ |
| Export all → .md | ✅ |
| GitHub auto-sync | ✅ |
| Background Sync API | ✅ (Chrome/Android) |
| PWA installable | ✅ |
| Auto-update system | ✅ |
| Haptic feedback | ✅ |

---

## Installation

### Desktop
1. Visit [https://shakuta.dev/thoughts/](https://shakuta.dev/thoughts/)
2. Use in browser or install as desktop app (Chrome: ⋮ → Install)

### Mobile (iOS)
1. Open in Safari
2. Tap Share → "Add to Home Screen"
3. App launches fullscreen like native app

### Mobile (Android)
1. Open in Chrome
2. Tap menu → "Add to Home Screen" or "Install app"
3. App launches fullscreen

---

## Usage

### Basic Capture

1. Open app at `shakuta.dev/thoughts/`
2. Type your thought
3. **Single-line mode**: Press Enter to capture
4. **Multi-line mode**: Press Cmd/Ctrl+Enter to capture
5. Repeat throughout the day

### Input Modes

Toggle between two input modes in Settings:

- **Single-line** - Input field, Enter to capture (quick thoughts)
- **Multi-line** - Textarea (3 lines), Cmd/Ctrl+Enter to capture (longer notes)

### Export

**Export Today:**
- Tap "Today" button on main screen
- Downloads markdown file for current day only
- Example: `thoughts-2024-12-28.md`

**Export All:**
- Open Settings (gear icon)
- Tap "Export All"
- Downloads all thoughts in single markdown file
- Example: `all-thoughts.md`

**Move to Obsidian:**
- Transfer downloaded .md file to your Obsidian vault
- Thoughts are formatted with timestamps and optional locations

---

## GitHub Sync (Optional)

Automatically sync thoughts to GitHub repository (e.g., Obsidian vault).

### Setup

1. Open Settings (gear icon)
2. Enter GitHub configuration:
   - **Personal Access Token** (PAT) - [Create here](https://github.com/settings/tokens)
     - Scopes needed: `repo` (full control of private repositories)
   - **Repository** - Format: `username/repo-name`
   - **Path** - Path in repo, e.g., `Daily Notes/`
   - **Branch** - Usually `main` or `master`
3. Choose sync mode:
   - **Auto** - Sync immediately after each capture
   - **Manual** - Sync on demand via "Sync Now" button
4. Tap "Save Settings"

### How Sync Works

- Thoughts are grouped by date into daily note files
- File format: `YYYY-MM-DD.md` (e.g., `2024-12-28.md`)
- Multiple thoughts on same day are batched into single commit
- Sync status shown for each thought:
  - ✅ **Synced** - Successfully uploaded to GitHub
  - ⏳ **Queued** - Waiting to sync
- **Background Sync** (Chrome/Android):
  - Syncs even when app is closed/minimized
  - Falls back to immediate sync on iOS/Safari

### Two-Way Sync

**Status:** Planned feature (TODO)

Will support:
- Download today's thoughts from GitHub on app load
- Merge with local thoughts
- Duplicate detection via sync flag
- Conflict resolution: merge both entries

---

## Markdown Output Format

```markdown
# Thoughts - 2024-12-28

- **14:32** | 📍 [52.23, 21.01](https://www.google.com/maps?q=52.23,21.01)
  The actual thought content goes here
  Can be multiline

- **14:15**
  Another thought without location
```

---

## Data Storage

### LocalStorage Schema

All thoughts stored in browser's `localStorage`:

**Key:** `thoughts`

**Value:** JSON array of thought objects

```json
{
  "id": 1703769600000,
  "text": "thought content",
  "timestamp": "2024-12-28T14:32:00.000Z",
  "location": {
    "lat": "52.23000",
    "lon": "21.01000"
  },
  "synced": false
}
```

**Additional keys:**
- `github_sync_settings` - GitHub configuration
- `input_mode` - Input mode preference (single/multi)

### Privacy & Security

- **No cloud storage** - Data never leaves your device unless you sync
- **GitHub PAT** - Stored in localStorage (encrypted by browser)
- **Location** - Optional, only captured if permission granted
- **No tracking** - No analytics, no cookies, no external requests

---

## Keyboard Shortcuts

- **Single-line mode:**
  - `Enter` - Capture thought

- **Multi-line mode:**
  - `Cmd/Ctrl + Enter` - Capture thought
  - `Enter` - New line

---

## Design

- **Theme:** Dark (#0a0a0a background, #4ade80 green accent)
- **Font:** JetBrains Mono (monospace)
- **Layout:** Mobile-first responsive
- **Safe-area insets:** Supports notched devices (iPhone X+)
- **Colors:**
  - Background: `#0a0a0a`
  - Text: `#e5e5e5`
  - Accent: `#4ade80`
  - Secondary: `#6b7280`

---

## Architecture

### Tech Stack
- **Vanilla JavaScript** (ES6+ with modules)
- **No frameworks** - No React, Vue, build tools
- **Zero dependencies** - Pure browser APIs
- **Service Worker** - Offline support, background sync
- **Web APIs:**
  - LocalStorage (persistence)
  - Geolocation API (optional coordinates)
  - Vibration API (haptic feedback)
  - Background Sync API (Chrome/Android)
  - GitHub REST API (sync)

### File Structure

```
static/thoughts/
├── index.html               # Minimal HTML shell
├── manifest.json            # PWA manifest
├── sw.js                    # Service Worker
├── styles.css               # All CSS styles
├── index.html.backup        # Backup of original single-file version
└── js/
    ├── app.js               # Main entry point
    ├── components/
    │   ├── capture-area.js  # Capture input & logic
    │   ├── settings-modal.js# Settings UI & export
    │   └── thoughts-list.js # Thought history display
    ├── services/
    │   ├── storage.js       # LocalStorage operations
    │   └── sync.js          # GitHub sync (up/down)
    └── utils/
        ├── datetime.js      # Date/time formatting
        └── markdown.js      # MD generation & parsing
```

### Module Organization

**app.js** (Main entry point)
- `init()` - Initialize app, setup listeners
- `setupEventListeners()` - Wire up UI events
- `updateStatus()` - Update sync status display
- `registerServiceWorker()` - Register SW, check for updates

**components/capture-area.js**
- `initCaptureArea()` - Initialize capture input
- `captureThought()` - Main capture logic
- `updateInputMode()` - Toggle single/multi-line mode

**components/thoughts-list.js**
- `renderThoughtsList()` - Render recent thoughts to UI

**components/settings-modal.js**
- `openSettings()` / `closeSettings()` - Modal control
- `saveSettings()` - Save GitHub & input mode settings
- `exportAll()` - Export all thoughts to markdown
- `manualSync()` - Trigger manual GitHub sync

**services/storage.js**
- `getThoughts()` / `saveThoughts()` - LocalStorage CRUD
- `addThought()` - Add new thought
- `getUnsyncedThoughts()` / `markAllAsSynced()` - Sync state
- `getSyncSettings()` / `saveSyncSettings()` - GitHub config
- `getInputMode()` / `saveInputMode()` - Input mode preference

**services/sync.js**
- `syncFromGitHub()` - Download today's thoughts (two-way sync)
- `syncToGitHub()` - Upload unsynced thoughts
- `queueSync()` - Queue background sync or immediate
- `isBrowserSyncSupported()` - Check Background Sync API support

**utils/markdown.js**
- `thoughtToMarkdown()` - Convert thought → markdown
- `generateMarkdown()` - Generate daily markdown
- `parseMarkdownThoughts()` - Parse GitHub markdown → thoughts
- `downloadFile()` - Trigger file download

**utils/datetime.js**
- `formatDate()` / `formatTime()` - Format timestamps
- `getToday()` - Get current date (YYYY-MM-DD)
- `getDateFromISO()` - Extract date from ISO string

**Service Worker (sw.js)**
- `install` - Cache all app files, skip waiting
- `activate` - Clean old caches, claim clients, notify update
- `fetch` - Network-first, fallback to cache
- `sync` - Background sync handler (Chrome/Android)
- `message` - Handle app messages (SKIP_WAITING)

---

## Auto-Update System

The app automatically checks for updates and prompts users to refresh:

1. **Service Worker Update Detection:**
   - Checks for SW updates every 60 seconds
   - `skipWaiting()` ensures immediate activation

2. **Update Banner:**
   - Shows when new version available
   - "Update Now" button triggers page reload
   - Loads new version instantly

3. **Version Display:**
   - Current version shown in Settings footer
   - Format: `v1.0.0`

---

## Browser Compatibility

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Basic PWA | ✅ | ✅ | ✅ | ✅ |
| LocalStorage | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Background Sync | ✅ | ❌* | ❌* | ✅ |
| Geolocation | ✅ | ✅ | ✅ | ✅ |
| Install to Home | ✅ | ✅ | ⚠️** | ✅ |

\* Falls back to immediate sync
\*\* Limited PWA support

---

## Troubleshooting

### App not updating on mobile

1. Kill the app completely (swipe up/force close)
2. Reopen - should show update banner
3. Tap "Update Now"
4. Check version in Settings

### Thoughts not syncing

1. Check GitHub settings in Settings menu
2. Verify PAT has `repo` scope
3. Check repository name format: `username/repo`
4. Check path doesn't start with `/`
5. Look for error messages in sync status

### Location not capturing

1. Check browser permissions (Settings → Site Settings → Location)
2. Grant location access when prompted
3. HTTPS required for geolocation
4. May not work on desktop without GPS

### Offline mode not working

1. Visit app online first (caches assets)
2. Check Service Worker registered (DevTools → Application → Service Workers)
3. Clear cache and reload if issues persist

### Export not downloading

1. Check browser download permissions
2. Try different browser
3. Check available disk space

---

## Development

### Architecture Migration (Dec 2025)

The app was refactored from a single-file monolith to a modular multi-file architecture:

**Before:**
- Single `index.html` with inline CSS and JavaScript (~1200 lines)
- Difficult to navigate and maintain
- All logic in one file

**After:**
- Modular ES6 structure with clear separation of concerns
- 9 focused modules averaging ~100-150 lines each
- Easier to test, debug, and extend
- Backup preserved at `index.html.backup`

**Benefits:**
- **Maintainability** - Find and fix bugs faster
- **Testability** - Can unit test individual modules
- **Reusability** - Share utilities across projects
- **Scalability** - Easy to add new features
- **Zero build step** - Still no webpack, babel, or npm

**How to restore single-file version:**
```bash
cp index.html.backup index.html
```

### Local Testing

**Option 1: Hugo development server**
```bash
cd ~/dev/ishakuta.github.io
hugo server -D
# Access at http://localhost:1313/thoughts/
```

**Option 2: Python HTTP server**
```bash
cd ~/dev/ishakuta.github.io
python3 -m http.server 8000
# Access at http://localhost:8000/static/thoughts/
```

### Testing Service Worker

```bash
# Chrome DevTools
1. Open http://localhost:1313/thoughts/
2. DevTools → Application tab
3. Service Workers section:
   - See registration status
   - Force update
   - Unregister

4. Cache Storage:
   - View cached assets
   - Clear cache

5. Console:
   - See [SW] log messages
```

### Testing Background Sync

```bash
# Chrome DevTools
1. Application → Service Workers
2. Check "Offline" checkbox
3. Capture thought (should queue)
4. Uncheck "Offline"
5. Check Console for sync event
```

### Code Modifications

All code is in `static/thoughts/index.html`:
- **HTML** - Lines 1-50
- **CSS** - Lines 51-250
- **JavaScript** - Lines 251-end

Service Worker: `static/thoughts/sw.js`

**Bumping version:**
1. Update `APP_VERSION` constant in index.html
2. Update `CACHE_NAME` in sw.js (triggers cache update)

---

## Deployment

Deployed automatically via Hugo build:

1. Edit `static/thoughts/index.html` or `sw.js`
2. Commit and push to master
3. GitHub Actions builds Hugo site
4. Deploys to GitHub Pages
5. Available at `shakuta.dev/thoughts/`

**No build step needed** - Static files served as-is by Hugo.

---

## Future Enhancements

### Planned (TODO)
- [ ] Two-way sync (download today's thoughts from GitHub)
- [ ] Multi-day sync scanning (currently only today)
- [ ] Tags support (parse #tags, include in export)
- [ ] Search/filter thoughts
- [ ] Delete individual thoughts (swipe to delete)
- [ ] Obsidian URI integration (`obsidian://` direct append)

### Considered
- Voice capture (Web Speech API)
- Categories/folders for exports
- Encryption for localStorage
- Import from markdown
- Conflict resolution UI

---

## UI Library Options (Future Experimentation)

Current implementation uses **Vanilla JS + ES6 Modules** for zero dependencies and full control. The following libraries are documented for future consideration via experimental branches:

### Comparison Table

| Library | Size | Build Tools | Best For | CDN |
|---------|------|-------------|----------|-----|
| **Vanilla JS** (current) | 0KB | ❌ No | Production apps, max performance, full control | N/A (built-in) |
| **Petite-Vue** ⭐ | 6KB | ❌ No | Reducing boilerplate, Vue-like reactivity | [unpkg.com](https://unpkg.com/petite-vue@0.4.1/dist/petite-vue.iife.js) |
| **Alpine.js** | 15KB | ❌ No | Declarative HTML, progressive enhancement | [jsdelivr.net](https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js) |
| **Preact + HTM** | 10KB | ❌ No | React developers, hooks, component architecture | [unpkg.com](https://unpkg.com/htm/preact/standalone.module.js) |

### 1. Vanilla JS + ES6 Modules (Current)

**Pros:**
- Zero dependencies
- Native, future-proof
- Full control, best performance
- Modular architecture with ES6 imports

**Cons:**
- More boilerplate than frameworks
- Manual state management
- More code for reactivity

**Example:**
```javascript
// components/thoughts-list.js
import { getThoughts } from '../services/storage.js';
import { formatDate } from '../utils/datetime.js';

export function renderThoughtsList(container) {
    const thoughts = getThoughts().slice(0, 10);

    container.innerHTML = thoughts.map(t => `
        <div class="thought-item">
            <span>${formatDate(t.timestamp)}</span>
            <p>${t.text}</p>
        </div>
    `).join('');
}
```

### 2. Petite-Vue (Recommended for Migration)

**Pros:**
- Tiny footprint (6KB)
- Vue-like reactive syntax
- Drop-in replacement for vanilla JS
- Progressive enhancement
- No build tools required

**Use case:** If boilerplate becomes tedious, easy migration path

**Example:**
```html
<script src="https://unpkg.com/petite-vue@0.4.1/dist/petite-vue.iife.js"></script>

<div v-scope="thoughtsList()">
    <div v-for="t in thoughts" :key="t.id">
        <span>{{ formatDate(t.timestamp) }}</span>
        <p>{{ t.text }}</p>
    </div>
</div>

<script>
import { getThoughts } from './services/storage.js';
import { formatDate } from './utils/datetime.js';

function thoughtsList() {
    return {
        thoughts: getThoughts().slice(0, 10),
        formatDate
    }
}
PetiteVue.createApp({ thoughtsList }).mount();
</script>
```

### 3. Alpine.js (Declarative HTML)

**Pros:**
- Declarative attributes in HTML
- Great for progressive enhancement
- Good documentation, active community
- jQuery-like simplicity

**Use case:** If you prefer keeping logic in HTML attributes

**Example:**
```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>

<div x-data="thoughtsList()">
    <template x-for="t in thoughts" :key="t.id">
        <div>
            <span x-text="formatDate(t.timestamp)"></span>
            <p x-text="t.text"></p>
        </div>
    </template>
</div>

<script>
import { getThoughts } from './services/storage.js';
import { formatDate } from './utils/datetime.js';

function thoughtsList() {
    return {
        thoughts: getThoughts().slice(0, 10),
        formatDate
    }
}
</script>
```

### 4. Preact + HTM (React-like)

**Pros:**
- React-like API (hooks, components)
- Fast rendering
- `htm` provides JSX-like syntax without build
- Component-based architecture

**Use case:** If familiar with React and want hooks/JSX

**Example:**
```javascript
import { html, render } from 'https://unpkg.com/htm/preact/standalone.module.js';
import { getThoughts } from './services/storage.js';
import { formatDate } from './utils/datetime.js';

function ThoughtsList() {
    const [thoughts, setThoughts] = useState(getThoughts().slice(0, 10));

    return html`
        <div>
            ${thoughts.map(t => html`
                <div key=${t.id}>
                    <span>${formatDate(t.timestamp)}</span>
                    <p>${t.text}</p>
                </div>
            `)}
        </div>
    `;
}

render(html`<${ThoughtsList} />`, document.getElementById('thoughtsList'));
```

### Experimental Branch Strategy

To evaluate libraries without affecting main codebase:

```bash
# Create experimental branches
git checkout -b experiment/petite-vue
git checkout -b experiment/alpine-js
git checkout -b experiment/preact-htm

# Test each library
# Compare: code size, developer experience, performance
# Decide whether to merge or stay with vanilla
```

---

## Main Site Integration

This PWA is part of the personal site at `shakuta.dev`:
- **Main site:** [README.md](./README.md) - Hugo-based portfolio
- **PWA location:** `/static/thoughts/` (served as-is by Hugo)
- **Navigation:** Link in main site menu

---

## License

MIT - Do whatever you want with it.
