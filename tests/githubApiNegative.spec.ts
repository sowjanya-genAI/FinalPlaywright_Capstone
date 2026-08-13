import { test, expect } from '@playwright/test';
import { GitHubRepoPage } from '../src/api-objects/GitHubRepoPage';
import { epic, feature, story, severity, owner, issue, step, attachment } from 'allure-js-commons'; // ✅ Allure v3 Clean Import
import negativeIssueData from '../data/negativeTestData.json';

const GITHUB_OWNER = process.env.GITHUB_USER || 'sowjanya-genAI';
test.describe.configure({ mode: 'serial' });
test.describe('GitHub REST API Negative Validation Guardrails', () => {
    let repoPage: GitHubRepoPage;
    const testBaseRepo = 'api-automation-test-2';

    test.beforeEach(async ({ request }) => {
        repoPage = new GitHubRepoPage(request);
        await epic('GitHub REST API Core Framework');
        await feature('Negative and Exception Security Testing');
    });

    test('11. Security Gate: Reject profile requests containing invalid auth tokens', async ({ request }) => {
        await story('Token Rejection Handling Matrix');
        await severity('critical');
        await owner('QA Automation Core Team');
        await issue('SEC-1042', 'https://yourcompany.com');

        const response = await step('Execute Bypass Request with Bad Credentials', async () => {
            return await request.get('https://api.github.com', {
                headers: {
                    'Authorization': 'Bearer NOT_A_REAL_TOKEN_ASSET_XYZ',
                    'Accept': 'application/vnd.github+json'
                }, ignoreHTTPSErrors: true
            });
        });

        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.message).toContain('Bad credentials');
    });

    test('12. Routing Error: Attempt fetching issue data from non-existent repository', async () => {
        await story('Invalid Deep Link Routing Fallbacks');
        await severity('normal');

        const nonExistentRepo = 'this-repo-does-not-exist-in-any-universe-999';
        const response = await repoPage.getIssues(GITHUB_OWNER, nonExistentRepo);

        expect(response.status()).toBe(404);
        const body = await response.json();
        expect(body.message).toContain('Not Found');
    });

    // Tests 13 & 14: DDT Invalid Body Submissions
    negativeIssueData.forEach((data, index) => {
        test(`DDT Negative Loop ${13 + index}: Verify 422 error on issue creation via ${data.scenario}`, async ({ request }) => {
            await story('API Schema Payload Injections');
            await severity('normal');

            const authPage = (repoPage as any).auth;

            const response = await step('Post Invalid Issue Body Payload', async () => {
                console.log(`Executing Negative Test Case: https://api.github.com/${GITHUB_OWNER}/${testBaseRepo}/issues`);
                const res = await request.post(`https://api.github.com/repos/${GITHUB_OWNER}/${testBaseRepo}/issues`, {
                    headers: authPage.getHeaders(),
                    data: data.payload
                });
                await attachment('Validation Error Body Payload Log', await res.text(), 'application/json');
                return res;
            });
            console.log(`Negative Test Case URL: ${response.url()}`);
            expect(response.status()).toBe(data.expectedStatus);
            const body = await response.json();
            const cleanedMessage = body.message.replace(/\s+/g, ' ').trim();
            console.log(`Validation Error Message: ${cleanedMessage}`);

            const cleanedExpectedMessage = data.errorMsg.replace(/\s+/g, ' ').trim();
            console.log(`Expected Error Message: ${cleanedExpectedMessage}`);
            expect(cleanedMessage).toContain(cleanedExpectedMessage);
        });
    });

    test('15. Schema Conflict: Block creation of identical repository names in same scope', async () => {
        await story('Namespace Conflict Matrix Handling');
        await severity('normal');

        const duplicateName = 'duplicate-protection-test-repo';
        await repoPage.createRepository(duplicateName, 'Initial setup tracking', false);

        try {
            const conflictResponse = await repoPage.createRepository(duplicateName, 'Secondary collision setup', false);
            expect(conflictResponse.status()).toBe(422);

            const body = await conflictResponse.json();
            expect(body.message).toContain('Repository creation failed.');
        } finally {
            await repoPage.deleteRepository(GITHUB_OWNER, duplicateName);
        }
    });
});
