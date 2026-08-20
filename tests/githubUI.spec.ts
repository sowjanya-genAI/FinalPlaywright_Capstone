import { test } from '@playwright/test';
import { RepositoryPage } from '../src/Pages/RepositoryPage';
import { AUTH_STATE_PATH } from '../playwright.config';
import * as fs from 'fs';
import { IssuePage } from '../src/Pages/IssuePage';
import { PullRequestPage } from '../src/Pages/PullRequestPage';
import { SearchPage } from '../src/Pages/SearchPage';
import { DashboardPage } from '../src/Pages/DashboardPage';

const owner = process.env.GITHUB_USERNAME!;
const pwd = process.env.GITHUB_PASS!;
const TOKEN = process.env.GITHUB_TOKEN;

test.describe('GitHub E2E Framework Automation Suite', () => {
    let repo: RepositoryPage;
    const now = new Date();
    const timestamp = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const repoName = `ui-clean-repo-${timestamp}`;

    test.beforeAll(async ({ playwright }) => {
        if (!fs.existsSync(AUTH_STATE_PATH)) {
            console.log('📡 Generating UI Session Context using Personal Access Token...');

            // 1. Launch a headless browser and page context instance
            const browser = await playwright.chromium.launch();
            const context = await browser.newContext();
            const page = await context.newPage();

            // 2. Set the PAT token header into the browser context engine
            await context.setExtraHTTPHeaders({
                'Authorization': `Bearer ${TOKEN}`,
                'Accept': 'application/vnd.github+json'
            });

            // 3. Navigate to a GitHub endpoint that forces session cookie generation
            // This tricks the browser into mapping session cookies to github.com
            await page.goto('/login');
            // 4. Save the generated browser storage context state (Cookies + LocalStorage) to disk
            await context.storageState({ path: AUTH_STATE_PATH });
            console.log('💾 UI Storage State saved successfully via PAT authentication handshake!');
        }
    });

    test.beforeEach(async ({ page }) => {
        repo = new RepositoryPage(page);
    });

    test.use({ storageState: AUTH_STATE_PATH });

    // 📦 MODULE 1: REPOSITORY LIFECYCLE & SETTINGS
    test('TC001 - Clean Repository Creation Flow', async ({ page }) => {
        const dashboard = new DashboardPage(page);

        await page.goto('/');
        await dashboard.navigateToNewRepoFlow();
        await repo.createNewRepositoryFromUI(repoName, 'Automation System create New repository Description');

        // Smart POM Verification with explicit custom error messages
        await repo.verifyRepositoryInitializedCleanly(repoName);
    });

    test('TC002 - Repository Metadata & Social Update', async ({ page }) => {
        await page.goto(`/${owner}/${repoName}`);
        await repo.updateMetadata('Automation System Engine Description', 'https://playwright.dev', 'playwright-framework');

        // Smart POM Verification with explicit custom error messages
        await repo.verifyMetadataUpdatedSuccessfully('Automation System Engine Description', 'playwright-framework');
    });

    test('TC03 - Add a New File on Main Repository Branch', async ({ page }) => {
        const uniqueFileName = `config-matrix-${Date.now()}.json`;
        const mockedPayload = `{ "playwright": "maximized", "pom": "true" }`;

        await page.goto(`/${owner}/${repoName}`);

        await repo.createNewFileInRepository(uniqueFileName, mockedPayload);
         const pr = new PullRequestPage(page);
        await pr.initializePR('Feature: Core Viewport Execution Matrices Layout');
        await pr.verifyPullRequestIsOpen();

    });

    // 🎫 MODULE 2: ISSUES & COLLABORATION SUBSYSTEMS
    test('TC004 - Rich-Text Issue Publication with Markdown Rendering', async ({ page }) => {
        const issue = new IssuePage(page);
        await page.goto(`/${owner}/${repoName}/issues/new`);

        await issue.publishMarkdownIssue('Bug: Core Layout UI Fault', '### Problem Details\n- Error rendering dynamic element blocks on ```typescript\nconsole.log("Suite maximized");\n``` runtime layers.');
        await issue.verifyMarkdownRenderedCorrectly('Problem Details');
    });

    test('TC005 - Interactive Commenting & Reaction Triggers,Code Review Diff Interaction', async ({ page }) => {
        const issue = new IssuePage(page);
        await page.goto(`/${owner}/${repoName}/issues/1`);

        await issue.addCommentAndReaction('Verified execution output metrics match targets completely.');
        await issue.verifyReactionCounterIncrements();
    });

    test('TC006 - Sidebar Metadata Assignment (Labels & Assignees)', async ({ page }) => {
        const issue = new IssuePage(page);
        await page.goto(`/${owner}/${repoName}/issues/1`);

        await issue.triageMetadata(owner);
        await issue.verifyTriageMetadataPersisted();
    });

    // 🔀 MODULE 3: PULL REQUEST (PR) ENGINE
    test('TC007 - Code Review Diff Interaction', async ({ page }) => {
        const pr = new PullRequestPage(page);
        await page.goto(`/${owner}/${repoName}/pull/1/files`);

        await pr.addInlineReviewComment('Optimize specific nested configuration reference matrices.');
        await pr.verifyInlineCommentVisible('Optimize specific nested configuration');
    });

    test('TC008 - Pull Request Squash and Merge', async ({ page }) => {
        const pr = new PullRequestPage(page);
        await page.goto(`/${owner}/${repoName}/pull/1`);

        await pr.executeSquashMerge();
        await pr.verifyPullRequestMergedCleanly();
    });

    // 🔍 MODULE 4: PLATFORM DISCOVERY & PROFILES
    test('TC09 - Global Search Filtering & Sorting Engine', async ({ page }) => {
        const search = new SearchPage(page);
        await page.goto('/search');

        await search.executeGlobalSearch('Playwright TypeScript setup Architecture template');
        await search.verifySearchQueryURLParameters();
    });

    test('TC010 - Profile Readme Showcase Customization', async ({ page }) => {
        const search = new SearchPage(page);
        await page.goto(`/${owner}`);

        await search.modifyShowcasePins(repoName);
        await search.verifyRepositoryIsPinned(repoName);
    });

  test('TC012 - Visit Profile Settings and Validate Displayed User Information', async ({ page }) => {
    const profilePage = new SearchPage(page);
    const expectedName = 'Sowjanya';
    const expectedCompany = 'Zensar Technologies';
    const expectedLocation = 'Bengaluru, India'; // Matched to localized test runner execution nodes
    await page.goto('/');

    await profilePage.navigateToProfileSettings();
    await profilePage.verifyDisplayedProfileInformation(expectedName, expectedCompany, expectedLocation);
  });

   test('TC013 - Permanent Repository Deletion and UI Confirmation', async ({ page }) => {
    await page.goto(`/${owner}/${repoName}`);

    await repo.purgeAndRepositoryPermanently(repoName,owner,pwd);
    await repo.verifyRepositoryDeletionConfirmed();
  });

});
