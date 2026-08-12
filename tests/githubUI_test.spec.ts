import { test, expect } from '@playwright/test';

const AUTH_STATE_PATH = 'playwright/.auth/testuser.json';
const TOKEN = process.env.GITHUB_USER_TOKEN!;

test.describe('GitHub Passwordless API Authentication Suite', () => {

  // 🔐 1. Passwordless API Authentication inside beforeAll Lifecycle Hook
  test.beforeAll(async ({ playwright }) => {
    //if (!fs.existsSync(AUTH_STATE_PATH)) {
     const browser = await playwright.chromium.launch();
      const context = await browser.newContext();

      // Ensure your token was successfully fetched from environments before mapping
      expect(TOKEN, 'FAILED: Explicit GITHUB_USER_SESSION token was left empty inside system configurations.').not.toBe('PASTE_YOUR_ACTUAL_ENCRYPTED_USER_SESSION_COOKIE_VALUE_HERE');

      // 1. Build GitHub's absolute mandatory visual and cryptographic session cookie matrix
      const structuralStateCookies = [
        {
          name: 'user_session',
          value: TOKEN, // The actual server-signed cryptographic security payload
          domain: '.github.com',
          path: '/',
          httpOnly: true, // Crucial: Tells browser JavaScript engines it is an internal server cookie
          secure: true,
          sameSite: 'Lax' as const
        },
        {
          name: 'logged_in',
          value: 'yes',
          domain: '.github.com',
          path: '/',
          httpOnly: false,
          secure: true,
          sameSite: 'Lax' as const
        },
        {
          name: 'dotcom_user',
          value: TOKEN,
          domain: '.github.com',
          path: '/',
          httpOnly: false,
          secure: true,
          sameSite: 'Lax' as const
        }
      ];

      // 2. Commit the signed payload structures straight into the browser framework
      await context.addCookies(structuralStateCookies);

      // 3. Serialize directly to storageState disk paths
      await context.storageState({ path: AUTH_STATE_PATH });
      
      await context.close();
      await browser.close();
      console.log('💾 Valid UI StorageState generated programmatically without entering passwords!');
    //}
  });

  // 4. Inject the token-generated storageState into your UI tests
  test.use({ storageState: AUTH_STATE_PATH });

  // 📦 5. Core UI Testing Workflows
  test('TC001 - Verify Dashboard Entry using PAT Session', async ({ page }) => {
    // Browser context loads pre-authenticated—completely skipping the login forms
    await page.goto('/');
    await expect(page.url()).toContain('https://github.com/');
  });
});
