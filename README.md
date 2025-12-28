# Ivan Shakuta - Personal Site & Thought Capture

Personal portfolio site built with Hugo and PaperMod theme, featuring an integrated PWA for quick thought capture.

## Project Overview

This repository contains two main components:
1. **Hugo Site** - Personal portfolio/blog at `shakuta.dev`
2. **Thought Capture PWA** - Standalone app at `shakuta.dev/thoughts/`

---

## Hugo Site Structure

### Technology Stack
- **Framework**: Hugo (v0.150.1+)
- **Theme**: PaperMod
- **Deployment**: GitHub Pages (via GitHub Actions)
- **Domain**: shakuta.dev (via CNAME)

### Directory Structure

```
ishakuta.github.io/
├── hugo.toml                # Main Hugo configuration
├── .github/
│   └── workflows/
│       └── hugo.yml         # GitHub Actions deployment workflow
├── content/                 # Markdown content
│   ├── about.md             # About page
│   └── search.md            # Search page
├── layouts/                 # Custom layouts
│   └── 404.html             # Custom 404 page
├── static/                  # Static files (served as-is)
│   ├── img/                 # Images, avatar, backgrounds
│   │   ├── avatar-icon.png
│   │   └── 404-southpark.jpg
│   └── thoughts/            # Thought Capture PWA (static content)
│       ├── index.html       # PWA app
│       └── manifest.json    # PWA manifest
├── themes/
│   └── PaperMod/            # PaperMod theme (git submodule)
├── public/                  # Generated site (not committed)
└── resources/               # Hugo cached resources (not committed)
```

### Key Configuration (hugo.toml)

- **Site Title**: Ivan Shakuta
- **Author**: Ivan Shakuta
- **URL**: shakuta.dev
- **Theme**: PaperMod
- **Navigation**: About, Thought Capture, Search
- **Social Links**: GitHub (ishakuta), LinkedIn (ishakuta), Telegram (ishakuta)
- **Features**: Reading time, code copy buttons, breadcrumbs, search (Fuse.js), RSS, sitemap
- **Profile Mode**: Enabled with avatar
- **Copyright**: 2007-2025

### Content Pages

- **Homepage** - Profile mode with avatar and social links
- **About** (`content/about.md`) - Personal info, tech stack, interests
- **Search** (`content/search.md`) - Fuse.js-powered search
- **404** (`layouts/404.html`) - Custom error page with South Park image

### Styling & Theme

- PaperMod theme (clean, minimal design)
- Light/dark mode support (theme toggle)
- Responsive layout
- Syntax highlighting (Monokai style)
- Code copy buttons

### Hugo Build Process

- Markdown processor: Goldmark (Hugo's default)
- Syntax highlighter: Chroma (Monokai style)
- Minification enabled in production
- Static files from `/static/` copied as-is to `/public/`
- RSS feed, JSON search index, sitemap auto-generated

---

## Thought Capture PWA

A minimal PWA for capturing random thoughts on the go. Exports to Obsidian-compatible markdown.

### Location
- **Path**: `/thoughts/`
- **URL**: `https://shakuta.dev/thoughts/`
- **Files**: `thoughts/index.html`, `thoughts/manifest.json`

### Goal

Capture fleeting thoughts instantly without friction. When an idea hits, open the app, type, capture. No login, no sync complexity, no cloud dependency. Export to Obsidian when ready.

### Core Principles

- **KISS** - Single HTML file, no build step, no dependencies
- **MVP** - Capture, store, export. Nothing else.
- **Speed** - Sub-second to first keystroke
- **Offline-first** - Works without internet (localStorage)
- **Privacy** - All data stays on device until you export

### Features

| Feature | Status |
|---------|--------|
| Quick text capture | ✅ |
| **Input mode toggle** | ✅ Multi-line or single-line |
| Auto datetime (ISO) | ✅ |
| Geolocation (optional) | ✅ |
| LocalStorage persistence | ✅ |
| **GitHub auto-sync** | ✅ Background Sync API |
| Export today → .md | ✅ |
| Export all → .md | ✅ |
| PWA installable | ✅ |
| Keyboard shortcuts | ✅ Cmd+Enter or Enter |
| Haptic feedback | ✅ |
| Sync status indicator | ✅ |
| Auto-update detection | ✅ With UI prompt |
| Version display | ✅ v1.0.0 |

### Installation on Phone

1. Open `https://shakuta.dev/thoughts/` in Safari (iOS) or Chrome (Android)
2. Tap Share → "Add to Home Screen"
3. App now launches fullscreen like native app

### Usage

#### Input Modes

**Multi-line mode (default):**
- 3-line text area for longer thoughts
- Press **Cmd/Ctrl+Enter** to capture
- Good for detailed notes with multiple lines

**Single-line mode:**
- Single text input for quick captures
- Press **Enter** to capture
- Fast for one-line thoughts
- Change in Settings → Input Mode

#### Manual Export (Fallback)

**"📥 Today" button** (main UI):
- Exports only today's thoughts
- File: `thoughts-2025-12-28.md`
- Quick daily export
- Use when GitHub sync is not configured

**"📥 Export All (.md)" button** (in Settings):
- Exports all thoughts from all days
- Groups by date with headers
- File: `thoughts-export-2025-12-28.md`
- Full backup of everything
- Useful for migration or backup

#### Auto-Sync Mode (Recommended)
1. Tap settings (⚙️) button
2. Create GitHub Personal Access Token:
   - Visit https://github.com/settings/tokens/new?scopes=repo
   - Grant **repo** scope
   - Copy token
3. Configure sync settings:
   - **Token**: Your GitHub PAT
   - **Repository**: `owner/repo` (e.g., `ishakuta/obsidian-vault`)
   - **File Path**: `Daily Notes/{date}.md` (use `{date}` for auto date)
   - **Sync Mode**: Auto (background sync)
4. Save settings
5. Capture thoughts normally - they auto-sync to GitHub
6. Obsidian Git plugin pulls changes automatically

**Sync behavior:**
- Thoughts queued locally when captured
- Auto-syncs using Background Sync API (Chrome, Edge, Android)
- Falls back to immediate sync on iOS/Safari (not supported)
- Groups thoughts by date
- Appends to existing daily notes
- Shows sync status (synced ✓ or queued)
- Battery-efficient (browser-managed timing)
- Syncs even when app is minimized/backgrounded (except iOS)

**Technical details:**
- Uses Service Worker with Background Sync API
- Browser schedules sync at optimal time (good network + battery)
- Automatic retry on network failure
- iOS/Safari: Falls back to immediate sync (same as before)
- No battery drain - browser controls timing

### Markdown Output Format

```markdown
# Thoughts - 2024-12-28

- **14:32** | 📍 [52.5251, 13.3694](https://www.google.com/maps?q=52.5251,13.3694)
  The actual thought content goes here
  Can be multiline

- **14:15**
  Another thought without location
```

### Data Storage

- All thoughts stored in `localStorage` under key `thoughts`
- Data structure:
```json
{
  "id": 1703769600000,
  "text": "thought content",
  "timestamp": "2024-12-28T14:32:00.000Z",
  "location": { "lat": "52.52510", "lon": "13.36940" }
}
```

### Design
- Dark theme (#0a0a0a background)
- JetBrains Mono font
- Green accent (#4ade80)
- Mobile-first responsive
- Safe-area insets for notched devices

### Key Functions
- `captureThought()` - Main capture logic
- `updateInputMode()` - Switch between multi-line and single-line input
- `getThoughts()` / `saveThoughts()` - localStorage interface
- `syncToGitHub()` - GitHub API sync logic
- `queueSync()` - Background Sync API or immediate fallback
- `exportToday()` - Export today's thoughts only
- `exportAll()` - Export all thoughts grouped by date
- `thoughtToMarkdown()` - Single thought → MD format
- `showUpdateBanner()` - Display app update notification

### Service Worker (`sw.js`)
- Handles Background Sync events
- Caches app for offline use (works offline)
- Auto-update with `skipWaiting()` and immediate activation
- Messages main app when updated (shows update banner)
- Checks for updates every 60 seconds
- **Limitation**: Cannot access localStorage when app fully closed (would need IndexedDB migration)

### Settings
- **Input Mode**: Multi-line (Cmd+Enter) or Single-line (Enter)
- **GitHub Auto-Sync**: Token, repo, path, sync mode
- **Export All**: Full backup button
- **Version Display**: Shows current app version (v1.0.0)

---

## For AI/LLM Continuation

### Context
- **Owner**: Ivan Shakuta (PHP dev, Obsidian user, productivity-focused)
- **Hugo Site**: PaperMod theme, light/dark mode, blog-focused
- **Thought Capture**: Vanilla HTML/CSS/JS, dark theme, mobile PWA
- **Integration**: Thought Capture lives at `/static/thoughts/` as static content

### Local Development

#### Hugo Site
```bash
# Install Hugo (macOS with Homebrew)
brew install hugo

# Run local server
cd ~/dev/ishakuta.github.io
hugo server -D

# Access at http://localhost:1313
# Thought Capture at http://localhost:1313/thoughts/
```

#### Quick Python Server (for thoughts app only)
```bash
cd ~/dev/ishakuta.github.io/static
python3 -m http.server 8000
# Open http://localhost:8000/thoughts/
```

### Deployment

```bash
# From ~/dev/ishakuta.github.io
git add .
git commit -m "Description of changes"
git push origin master

# GitHub Actions auto-deploys to shakuta.dev
# Workflow: .github/workflows/hugo.yml
```

### Code Style Guidelines

**Hugo Site:**
- Markdown for content in `content/` directory
- YAML front matter for all pages
- Custom layouts in `layouts/` (override theme)
- Static files in `static/` (served as-is)
- Follow PaperMod conventions for configuration

**Thought Capture PWA:**
- No build tools, no npm, no transpilation
- Single file preferred (inline CSS/JS)
- ES6+ but widely supported features only
- Mobile-first responsive
- Accessibility basics (semantic HTML, focus states)

### Analytics

**Current Setup**: GoatCounter (free, privacy-friendly)

- **Service**: [GoatCounter](https://www.goatcounter.com)
- **Dashboard**: https://shakuta.goatcounter.com
- **Documentation**: https://shakuta.goatcounter.com/help/start
- **Implementation**: `layouts/partials/extend_head.html`
- **Privacy**: Cookie-free, GDPR compliant, lightweight
- **Features**: Page views, referrers, browsers, countries, screen sizes

**How it works**:
- Analytics script only loads in production (`hugo.IsProduction`)
- Disabled during local development (`hugo server`)
- No tracking of development traffic

**Future Migration**: Plan to self-host Matomo when server is available

### Hugo Site Enhancement Ideas
1. **Blog Posts** - Add posts to `content/posts/` directory
2. **Projects Page** - Showcase portfolio projects
3. **Comments** - Enable giscus or Utterances
4. **Custom CSS** - Add `assets/css/extended/` for theme overrides
5. **Archives** - Add archive page for posts by date

### Thought Capture Enhancement Ideas
1. **IndexedDB migration** - Enable sync when app fully closed (currently requires app open or recently closed)
2. **Tags support** - Parse #tags from text, include in export
3. **Voice capture** - Web Speech API for dictation
4. **Search/filter** - Find past thoughts
5. **Delete individual** - Swipe to delete
6. **Categories/folders** - Organize exports by topic
7. **Encryption** - Encrypt localStorage for privacy
8. **CRDT sync** - Multi-device conflict-free sync (future, requires sync server)

### Important Notes
- `/static/thoughts/` directory is served as static content (not processed by Hugo)
- Hugo copies everything from `/static/` to `/public/` as-is
- Manifest paths use `/thoughts/` as scope and start_url
- Both projects share shakuta.dev domain but are independent
- PaperMod theme is added as git submodule (`.gitmodules`)
- Don't commit `/public/` or `/resources/` directories (build artifacts)

## License

MIT - Do whatever you want with it.
