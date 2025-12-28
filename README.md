# Ivan Shakuta - Personal Site

Personal portfolio site built with Hugo and PaperMod theme.

Live at: **https://shakuta.dev**

---

## Technology Stack

- **Framework**: Hugo (v0.150.1+)
- **Theme**: PaperMod
- **Deployment**: GitHub Pages (via GitHub Actions)
- **Analytics**: GoatCounter (privacy-friendly, cookie-free)

---

## Directory Structure

```
ishakuta.github.io/
├── hugo.toml                # Main Hugo configuration
├── .github/
│   └── workflows/
│       └── hugo.yml         # GitHub Actions deployment
├── content/                 # Markdown content
│   ├── about.md
│   └── search.md
├── layouts/                 # Custom layouts
│   ├── 404.html
│   └── partials/
│       └── extend_head.html # Analytics integration
├── static/                  # Static files (served as-is)
│   ├── img/                 # Images
│   └── thoughts/            # Thought Capture PWA
├── themes/
│   └── PaperMod/            # Theme (git submodule)
├── public/                  # Generated site (gitignored)
└── resources/               # Hugo cache (gitignored)
```

---

## Local Development

### Prerequisites
```bash
# Install Hugo (macOS)
brew install hugo

# Verify installation
hugo version  # Should be v0.150.1+
```

### Running Locally
```bash
# Clone repository
git clone --recurse-submodules git@github.com:ishakuta/ishakuta.github.io.git
cd ishakuta.github.io

# Start development server
hugo server -D

# Access at: http://localhost:1313
```

**Development server features:**
- Live reload on file changes
- Drafts visible with `-D` flag
- Fast rebuilds (~20ms)

### Building for Production
```bash
# Build static site
hugo --minify

# Output in ./public/
# Deployed automatically via GitHub Actions
```

---

## Configuration

### Main Config (`hugo.toml`)

Key settings:
- **baseURL**: `https://shakuta.dev/`
- **title**: Ivan Shakuta
- **theme**: PaperMod
- **Profile mode**: Enabled with avatar
- **Navigation**: About, Thought Capture, Search
- **Social**: GitHub, LinkedIn, Telegram

### Content Management

**Add new page:**
```bash
hugo new content/page-name.md
```

**Add blog post:**
```bash
hugo new content/posts/my-post.md
```

**Front matter example:**
```yaml
---
title: "My Post"
date: 2025-12-28
draft: false
---
```

---

## Deployment

### Automatic (GitHub Actions)

Workflow: `.github/workflows/hugo.yml`

**Triggers:**
- Push to `master` branch
- Manual dispatch

**Process:**
1. Install Hugo CLI (v0.150.1)
2. Checkout with submodules
3. Build with `--minify`
4. Deploy to GitHub Pages

**Check deployment:**
- https://github.com/ishakuta/ishakuta.github.io/actions

### Manual
```bash
git add .
git commit -m "Update content"
git push origin master

# GitHub Actions deploys automatically (~2-3 min)
```

---

## Theme Customization

### Override Layouts

Create files in `layouts/` matching theme structure:
```
layouts/
├── partials/
│   └── extend_head.html    # Custom head content
└── 404.html                # Custom 404 page
```

### Custom CSS

PaperMod supports extended CSS:
```bash
# Create custom CSS
mkdir -p assets/css/extended
touch assets/css/extended/custom.css
```

### Modify Theme

Theme is git submodule:
```bash
cd themes/PaperMod
git pull origin master
cd ../..
git add themes/PaperMod
git commit -m "Update PaperMod theme"
```

---

## Analytics

**GoatCounter** (privacy-friendly)
- **Dashboard**: https://shakuta.goatcounter.com
- **Integration**: `layouts/partials/extend_head.html`
- **Privacy**: Cookie-free, GDPR compliant, no tracking

Only loads in production (not in `hugo server`).

---

## Troubleshooting

### Theme not loading
```bash
# Update submodules
git submodule update --init --recursive
```

### Build errors
```bash
# Clean Hugo cache
rm -rf public/ resources/

# Rebuild
hugo --minify
```

### Port 1313 already in use
```bash
# Kill existing Hugo server
lsof -ti:1313 | xargs kill -9

# Or use different port
hugo server -p 1314
```

---

## Project Components

1. **Hugo Site** - This documentation
2. **[Thought Capture PWA](./THOUGHT_CAPTURE.md)** - Separate app documentation

---

## License

MIT - Personal portfolio site
