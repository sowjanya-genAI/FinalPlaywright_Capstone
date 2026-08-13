import { test, expect, request } from '@playwright/test';
import { GitHubRepoPage } from '../src/api-objects/GitHubRepoPage';
import { epic, feature, severity } from 'allure-js-commons'; // ✅ Allure v3 Clean Import
import repoData from '../data/repoTestData.json';
import issueData from '../data/issueTestData.json';

const GITHUB_OWNER = process.env.GITHUB_USERNAME!; 
test.describe.configure({ mode: 'serial' });
test.describe('GitHub REST API Engineering Pipeline Verifications', () => {
    let repoPage: GitHubRepoPage;
     let customContext; // Reference to hold clean runtime engine

    const testBaseRepo = 'api-automation-master-hub';

   test.beforeEach(async () => {
        // This completely bypasses playwright.config.ts base settings or global routing proxies
        customContext = await request.newContext({
            baseURL: 'https://api.github.com'
        });
        
        repoPage = new GitHubRepoPage(customContext);
        
        await epic('GitHub REST API Core Framework');
        await feature('Positive E2E Workflow Operations');
    });

    test('1. Verify user profile retrieval with valid token authorization', async () => {
        await severity('critical');
        const response = await repoPage.getAuthenticatedUser();
        expect(response.status()).toBe(200);
        
        const body = await response.json();
        expect(body).toHaveProperty('login');
        expect(body.id).toBeGreaterThan(0);
    });

    // Tests 2, 3, 4: DDT Repository Provisioning
    repoData.forEach((data, index) => {
        test(`${2 + index}. DDT Verification: Create repository variant - ${data.name}`, async () => {
            await severity('normal');
            const response = await repoPage.createRepository(data.name, data.description, data.private);
            expect(response.status()).toBe(data.expectedCode);

            const body = await response.json();
            expect(body.name).toBe(data.name);
            expect(body.private).toBe(data.private);

            await repoPage.deleteRepository(GITHUB_OWNER, data.name);
        });
    });

    test('5. Baseline Setup: Ensure master issue management host repository exists', async () => {
        await severity('normal');
        const response = await repoPage.createRepository(testBaseRepo, 'Temporary issue track engine', false);
        expect([201, 422]).toContain(response.status());
    });

    // Tests 6, 7, 8: DDT Issue Tracking Pipeline
    issueData.forEach((data, index) => {
        test(`${6 + index}. DDT Verification: Inject structured issue asset - ${data.title}`, async () => {
            await severity('normal');
            const response = await repoPage.createIssue(GITHUB_OWNER, testBaseRepo, data.title, data.body, [data.label]);
            expect(response.status()).toBe(201);

            const body = await response.json();
            expect(body.title).toBe(data.title);
            expect(body.body).toBe(data.body);
            expect(body.labels[0].name).toBe(data.label);
            expect(body.state).toBe('open');
        });
    });

    test('9. Query validation array context list for newly created issue objects', async () => {
        await severity('minor');
        const response = await repoPage.getIssues(GITHUB_OWNER, testBaseRepo);
        expect(response.status()).toBe(200);

        const body = await response.json();
        console.log(body);
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThanOrEqual(3);
    });

    test('10. Complete Tear Down Validation Loop', async () => {
        await severity('critical');
        const response = await repoPage.deleteRepository(GITHUB_OWNER, testBaseRepo);
        expect(response.status()).toBe(204);
    });
});
