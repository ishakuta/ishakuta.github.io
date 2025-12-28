#!/bin/bash
# Run ESLint on Thought Capture app

cd "$(dirname "$0")/.."

echo "🔍 Running ESLint on Thought Capture app..."

cd static/thoughts

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run ESLint
npm run lint

# Capture exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Lint check passed!"
else
    echo "⚠️  Lint check found issues (see above)"
    echo "💡 Run 'npm run lint:fix' in static/thoughts/ to auto-fix some issues"
fi

exit $EXIT_CODE
