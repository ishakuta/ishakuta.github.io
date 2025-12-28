# ESLint Setup - Thought Capture PWA

## Overview

ESLint is configured to run on every commit and enforce code quality standards focused on maintainability, complexity, and common errors.

## Running ESLint

### Manual Execution

```bash
# From project root
./scripts/lint.sh

# Or from static/thoughts/
cd static/thoughts
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues where possible
```

### Automatic Execution

ESLint runs automatically on **every commit** that touches `static/thoughts/` files:

```bash
git add .
git commit -m "Your message"
# ESLint runs automatically after version update
```

**Behavior:**
- ✅ **Warnings:** Allowed, commit proceeds
- ❌ **Errors:** Block commit, must be fixed

No environment variable needed - it always runs.

## Configuration

### Files

- **`static/thoughts/package.json`** - npm dependencies
- **`static/thoughts/.eslintrc.json`** - ESLint rules
- **`scripts/lint.sh`** - Lint script (auto-installs deps if needed)
- **`.git/hooks/pre-commit`** - Git hook that runs ESLint

### Rules Enforced

#### Complexity & Maintainability
- **Cyclomatic complexity:** ≤ 10 (warns if exceeded)
- **Max function length:** ≤ 50 lines (warns if exceeded)
- **Max nesting depth:** ≤ 4 levels
- **Max parameters:** ≤ 4 per function
- **Max nested callbacks:** ≤ 3 levels

#### Code Quality
- `no-var` - Must use `let` or `const` (error)
- `prefer-const` - Use `const` when variable isn't reassigned (warning)
- `no-unused-vars` - No unused variables (warning, except prefixed with `_`)
- `eqeqeq` - Use `===` instead of `==` (warning)
- `no-eval` - No `eval()` usage (error)
- `no-implied-eval` - No `setTimeout(string)` (error)

#### Code Style
- `semi` - Require semicolons (error)
- `quotes` - Prefer single quotes (warning)
- `indent` - 4 spaces (warning)

## Suppressing Warnings

Sometimes a function legitimately needs higher complexity. Use inline comments with justification:

```javascript
// eslint-disable-next-line complexity -- Geocoding logic requires multiple conditional branches
async function reverseGeocode(lat, lon) {
    // ... complex but necessary logic
}
```

**Guidelines:**
- Always include `--` followed by a reason
- Only suppress when refactoring would reduce readability
- Keep suppressions to a minimum

## Current Status

✅ **All checks passing** (0 errors, 0 warnings)

Suppressions currently in place:
1. `syncFromGitHub()` - Multi-step sync logic (60 lines)
2. `syncToGitHub()` - Validation + grouping logic (complexity 12)
3. `reverseGeocode()` - API response parsing (complexity 13)

## Fixing Common Issues

### Unused variable
```javascript
// ❌ Bad
function example(foo, bar) {
    return foo; // bar is unused
}

// ✅ Good (prefix with _)
function example(foo, _bar) {
    return foo;
}

// ✅ Good (remove it)
function example(foo) {
    return foo;
}
```

### Should use const
```javascript
// ❌ Bad
let cache = [];
cache.push(item);

// ✅ Good
const cache = [];
cache.push(item); // const allows mutation, just not reassignment
```

### Complex function
```javascript
// ❌ Bad (complexity 15)
function processData(data) {
    if (a) {
        if (b) {
            if (c) {
                // ... many nested conditions
            }
        }
    }
}

// ✅ Good (split into smaller functions)
function processData(data) {
    if (!isValid(data)) return null;
    return transform(data);
}

function isValid(data) { /* ... */ }
function transform(data) { /* ... */ }
```

## IDE Integration

### VS Code

Install ESLint extension:
```bash
code --install-extension dbaeumer.vscode-eslint
```

Add to `.vscode/settings.json`:
```json
{
  "eslint.workingDirectories": ["static/thoughts"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### WebStorm / IntelliJ

ESLint is auto-detected. Enable under:
- Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
- Check "Automatic ESLint configuration"

## Troubleshooting

### ESLint not running on commit?
```bash
# Check hook is executable
ls -la .git/hooks/pre-commit
# Should show -rwxr-xr-x

# If not executable:
chmod +x .git/hooks/pre-commit
```

### Dependencies not installed?
```bash
cd static/thoughts
npm install
```

### Want to skip ESLint for one commit?
```bash
# Not recommended, but if absolutely necessary:
git commit --no-verify -m "Emergency fix"
```

### ESLint version warnings?
These are expected - we're using ESLint 8.x which is stable. ESLint 9.x requires major config changes. We can upgrade later if needed.

## Maintenance

### Update ESLint
```bash
cd static/thoughts
npm update eslint eslint-plugin-complexity
```

### Adjust complexity thresholds
Edit `static/thoughts/.eslintrc.json`:
```json
{
  "rules": {
    "complexity": ["warn", 15],  // Increase from 10 to 15
    "max-lines-per-function": ["warn", { "max": 75 }]  // Increase from 50 to 75
  }
}
```

### Add new rules
See [ESLint Rules](https://eslint.org/docs/latest/rules/) for all available rules.

## Why These Rules?

- **Complexity limits:** Reduce cognitive load, improve testability
- **Function length limits:** Encourage single responsibility principle
- **No `var`:** Prevent scope confusion (block-scoped `let`/`const` are clearer)
- **No `eval`:** Security risk, performance issue
- **Prefer `const`:** Signals intent, prevents accidental reassignment
- **Semicolons:** Avoid ASI (Automatic Semicolon Insertion) edge cases

## Philosophy

ESLint is a **guide**, not a tyrant:
- Warnings suggest improvements but don't block work
- Errors prevent common bugs and security issues
- Suppressions are allowed with justification
- Rules can be adjusted if they don't fit our codebase

The goal is **maintainable, readable code**, not perfect adherence to arbitrary limits.
