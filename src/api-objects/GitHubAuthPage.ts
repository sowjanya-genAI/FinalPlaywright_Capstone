import { APIRequestContext } from '@playwright/test';

export class GitHubAuthPage {
    private request: APIRequestContext;

    constructor(request: APIRequestContext) {
        this.request = request;
    }

    // Dynamic endpoint helper injecting GitHub personal access token authorization state headers
    getHeaders() {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('Missing GITHUB_TOKEN environment variable config definition asset!');
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
    }
}
