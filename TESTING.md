# Test Plan - Thought Capture PWA

## Philosophy

For a PWA heavily dependent on browser APIs (LocalStorage, Service Worker, Geolocation, etc.), **browser automation tests** provide the most value. Unit tests would require extensive mocking and wouldn't catch real integration issues.

## Recommended Approach: Playwright

**Why Playwright?**
- Tests in real browsers (Chrome, Firefox, Safari/WebKit)
- Built-in support for PWA features (Service Workers, offline mode)
- Mobile device emulation (iOS Safari, Android Chrome)
- Screenshots/videos on failure
- Fast, reliable, modern API
- TypeScript support
- Good documentation

**Alternative:** Cypress (similar benefits, slightly different API)

## Test Categories

### 1. Critical Path Tests (Must Have)

These tests cover the core functionality that must always work:

#### 1.1 Capture Flow
- **Test:** Basic thought capture
  - Open app
  - Type text into input
  - Click "Capture" or press Cmd/Ctrl+Enter
  - Verify thought appears in history
  - Verify input is cleared
  - Verify toast notification shown

- **Test:** Multi-line vs single-line mode
  - Switch to single-line mode in settings
  - Verify Enter key captures (not newline)
  - Switch to multi-line mode
  - Verify Enter creates newline, Cmd/Ctrl+Enter captures

- **Test:** Location capture
  - Mock geolocation API
  - Capture thought
  - Verify location coordinates saved
  - Verify coordinates appear in thought display

#### 1.2 Export Flow
- **Test:** Export today
  - Capture 2-3 thoughts
  - Click "Today" button
  - Verify .md file downloads
  - Verify file content matches expected markdown format
  - Verify timestamps are correct

- **Test:** Export all
  - Capture thoughts over multiple "days" (by mocking date)
  - Click "Export All" in settings
  - Verify all thoughts exported grouped by date

#### 1.3 Sync Flow
- **Test:** GitHub sync configuration
  - Open settings
  - Fill in GitHub token, repo, path, branch
  - Save settings
  - Verify settings persisted (reload and check)

- **Test:** Manual sync (upload)
  - Mock GitHub API (intercept fetch requests)
  - Capture thought
  - Click "Sync Now"
  - Verify API call made with correct data
  - Verify thought marked as synced

- **Test:** Two-way sync (download)
  - Mock GitHub API to return existing thoughts
  - Open app with auto-sync enabled
  - Verify remote thoughts merged with local
  - Verify no duplicates
  - Verify chronological sorting

#### 1.4 PWA Features
- **Test:** Install prompt
  - Visit app in Chrome/Edge
  - Verify install prompt appears (or can be triggered)
  - Verify manifest.json is valid

- **Test:** Offline mode
  - Load app while online
  - Go offline (Network tab: Offline mode)
  - Verify app still loads from cache
  - Capture thought while offline
  - Verify thought saved to LocalStorage
  - Go back online
  - Verify sync triggers

- **Test:** Service Worker updates
  - Load app with old SW
  - Deploy new SW version
  - Verify update banner appears
  - Click "Update Now"
  - Verify app reloads with new version

### 2. Feature Flag Tests (Important)

- **Test:** Query param activation
  - Visit `/?ff=experimental`
  - Open settings
  - Verify experimental features section visible
  - Visit `/?ff=geocoding`
  - Verify only geocoding enabled

- **Test:** Console API
  - Run `featureFlags.list()` in console
  - Verify output shows all features
  - Run `featureFlags.enable('geocoding')`
  - Verify geocoding enabled
  - Reload page
  - Verify geocoding still enabled (localStorage persistence)

- **Test:** Settings UI toggle
  - Enable experimental mode via query param
  - Open settings
  - Toggle geocoding on/off
  - Save settings
  - Verify feature state persisted

### 3. Geocoding Tests (Experimental Feature)

- **Test:** Geocoding after capture
  - Enable geocoding feature
  - Mock Nominatim API
  - Capture thought with location
  - Verify API call made with rounded coordinates
  - Verify location name added to thought
  - Verify thought re-renders with location name

- **Test:** Geocoding cache
  - Enable geocoding
  - Mock Nominatim API
  - Capture two thoughts with same rounded coordinates
  - Verify only one API call made (cache hit)

- **Test:** Sync waits for geocoding
  - Enable geocoding and auto-sync
  - Mock both Nominatim and GitHub APIs
  - Capture thought with location
  - Verify sync waits for geocoding to complete
  - Verify synced thought includes location name

### 4. Edge Cases & Error Handling

- **Test:** Empty thought
  - Try to capture empty input
  - Verify nothing happens (no thought added)

- **Test:** Very long thought
  - Capture thought with 10,000 characters
  - Verify it's saved and displayed correctly
  - Verify export works

- **Test:** GitHub API errors
  - Mock 401 Unauthorized
  - Trigger sync
  - Verify error toast shown
  - Mock 409 Conflict (file changed)
  - Verify handled gracefully

- **Test:** Quota exceeded (LocalStorage full)
  - Fill LocalStorage to quota
  - Try to capture thought
  - Verify error handling (ideally graceful degradation)

- **Test:** Concurrent edits (two tabs)
  - Open app in two tabs
  - Capture thought in tab 1
  - Verify tab 2 sees update (via localStorage events or on refresh)

### 5. Cross-Browser & Device Tests

Test matrix:
- **Desktop:** Chrome, Firefox, Safari, Edge
- **Mobile:** iOS Safari, Android Chrome
- **Viewports:** 375x667 (iPhone SE), 1920x1080 (Desktop)

Focus areas:
- Touch interactions (tap, swipe) on mobile
- Keyboard shortcuts (Cmd/Ctrl+Enter) on desktop
- Settings modal scrolling on small screens
- PWA install flow on each platform

## Manual Test Checklist

Some things are hard to automate and should be tested manually:

- [ ] Install PWA to home screen (iOS)
- [ ] Install PWA to home screen (Android)
- [ ] Verify app opens fullscreen without browser chrome
- [ ] Test haptic feedback on capture (mobile)
- [ ] Verify geolocation permission prompt (first time)
- [ ] Test Background Sync (capture while offline, app closed, then open)
- [ ] Verify auto-update works (deploy new version, wait 5 min, check for banner)
- [ ] Test with real GitHub repo (not mocked)
- [ ] Verify Obsidian can open exported markdown files
- [ ] Test with slow 3G connection (throttling)

## Implementation Plan (When Ready)

### Phase 1: Setup
1. Install Playwright: `npm install -D @playwright/test`
2. Create `tests/` directory in `static/thoughts/`
3. Create `playwright.config.js`
4. Add test scripts to `package.json`

### Phase 2: Critical Path Tests
1. Write tests for capture flow (highest priority)
2. Write tests for export flow
3. Write tests for sync flow
4. Run on CI/CD (GitHub Actions)

### Phase 3: Comprehensive Coverage
1. Add feature flag tests
2. Add geocoding tests
3. Add edge case tests
4. Add cross-browser tests

### Phase 4: Visual Regression (Optional)
1. Add screenshot comparison tests
2. Catch UI regressions automatically

## Example Test (Playwright)

```javascript
// tests/capture.spec.js
import { test, expect } from '@playwright/test';

test('should capture a thought and display it in history', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:8000/thoughts/');

  // Type thought
  const input = page.locator('#thoughtInput');
  await input.fill('This is a test thought');

  // Capture (click button)
  await page.locator('button.btn-primary').click();

  // Verify thought appears in history
  const thoughts = page.locator('.thought-item');
  await expect(thoughts.first()).toContainText('This is a test thought');

  // Verify input cleared
  await expect(input).toHaveValue('');

  // Verify toast shown
  const toast = page.locator('#toast');
  await expect(toast).toContainText('Captured ✓');
});

test('should export thoughts to markdown', async ({ page }) => {
  await page.goto('http://localhost:8000/thoughts/');

  // Capture a thought
  await page.locator('#thoughtInput').fill('Export test');
  await page.locator('button.btn-primary').click();

  // Set up download listener
  const downloadPromise = page.waitForEvent('download');

  // Click export today
  await page.locator('button:has-text("📥 Today")').click();

  // Wait for download
  const download = await downloadPromise;

  // Verify filename
  expect(download.suggestedFilename()).toMatch(/thoughts-\d{4}-\d{2}-\d{2}\.md/);

  // Read downloaded file content
  const content = await download.path().then(path =>
    require('fs').promises.readFile(path, 'utf-8')
  );

  // Verify content
  expect(content).toContain('# Thoughts -');
  expect(content).toContain('Export test');
});
```

## Running Tests

```bash
# Install dependencies
cd static/thoughts
npm install

# Run all tests
npm test

# Run tests in headed mode (see browser)
npm test -- --headed

# Run tests in specific browser
npm test -- --project=firefox

# Run tests on mobile
npm test -- --project=mobile-chrome

# Debug a specific test
npm test -- --debug tests/capture.spec.js

# Update screenshots (visual regression)
npm test -- --update-snapshots
```

## Continuous Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        working-directory: static/thoughts
        run: npm ci
      - name: Install Playwright browsers
        working-directory: static/thoughts
        run: npx playwright install --with-deps
      - name: Run tests
        working-directory: static/thoughts
        run: npm test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-results
          path: static/thoughts/test-results/
```

## Maintenance

- Run tests before major releases
- Update snapshots when UI changes intentionally
- Add new tests when adding features
- Review and fix flaky tests immediately
- Keep Playwright updated: `npm update @playwright/test`

## Notes

- **LocalStorage persistence:** Tests should clear localStorage between runs
- **Service Worker:** May need to unregister SW between tests
- **Time-dependent tests:** Mock `Date.now()` for consistent results
- **GitHub API mocking:** Use Playwright's route interception
- **Parallel execution:** Tests should be independent (no shared state)

## Cost-Benefit Analysis

**High Value Tests** (write first):
- ✅ Capture flow
- ✅ Export flow
- ✅ Sync upload
- ✅ Offline mode

**Medium Value Tests:**
- Feature flags
- Geocoding
- Settings persistence
- Two-way sync

**Lower Value Tests** (automate if time permits, otherwise manual):
- Error handling edge cases
- Cross-browser quirks
- Visual regression
- Performance metrics

## Conclusion

Start with **Playwright** for browser automation, focus on **critical path tests** first, then expand coverage. Avoid unit tests unless testing pure utility functions (like markdown parsing). The goal is to catch real bugs that users would encounter, not achieve 100% code coverage.
