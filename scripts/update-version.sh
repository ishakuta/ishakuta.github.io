#!/bin/bash
# Auto-generate version.js with git commit hash

# Get short git hash
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Get current date
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Generate version.js
cat > static/thoughts/js/version.js <<EOF
// Auto-generated version file
// Updated by git pre-commit hook
// DO NOT EDIT MANUALLY

export const APP_VERSION = '${GIT_HASH}';
export const GIT_HASH = '${GIT_HASH}';
export const BUILD_DATE = '${BUILD_DATE}';
EOF

echo "✓ Updated version.js: ${GIT_HASH} (${BUILD_DATE})"

# Update Service Worker cache name with git hash
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/const CACHE_NAME = 'thought-capture-.*';/const CACHE_NAME = 'thought-capture-${GIT_HASH}';/" static/thoughts/sw.js
else
    # Linux
    sed -i "s/const CACHE_NAME = 'thought-capture-.*';/const CACHE_NAME = 'thought-capture-${GIT_HASH}';/" static/thoughts/sw.js
fi

echo "✓ Updated sw.js cache: thought-capture-${GIT_HASH}"

# Stage the updated files
git add static/thoughts/js/version.js static/thoughts/sw.js 2>/dev/null || true
