import { APIRequestContext, APIResponse } from '@playwright/test';
import { GitHubAuthPage } from './GitHubAuthPage';
import { step, attachment } from 'allure-js-commons'; // ✅ Allure v3 Clean Import
import process from 'process';

export class GitHubRepoPage {
    private request: APIRequestContext;
    private auth: GitHubAuthPage;

    constructor(request: APIRequestContext) {
        this.request = request;
        this.auth = new GitHubAuthPage(request);
    }

    async getAuthenticatedUser(): Promise<APIResponse> {
        return await step('GET Authenticated User Profile', async () => {
            const response = await this.request.get(`https://api.github.com/users/${process.env.GITHUB_USERNAME}`, {
                headers: this.auth.getHeaders(),
            });
            console.log(`Authenticated User Profile Response:  ${this.auth.getHeaders().Accept}-${this.auth.getHeaders()['X-GitHub-Api-Version']}`);
            await attachment('User Profile Response', await response.text(), 'application/json');
            return response;
        });
    }

    async createRepository(name: string, description: string, isPrivate: boolean): Promise<APIResponse> {
        return await step(`POST Create Repository Asset: ${name}`, async () => {
            const response = await this.request.post('https://api.github.com/user/repos', {
                headers: this.auth.getHeaders(),
                data: { name, description, private: isPrivate }
            });
            await attachment(`Repository Creation Log - Status ${response.status()}`, await response.text(), 'application/json');
            return response;
        });
    }

    async deleteRepository(owner: string, repo: string): Promise<APIResponse> {
        return await step(`DELETE Purge Repository Workspace: "${owner}/${repo}"`, async () => {
            const response = await this.request.delete(`https://api.github.com/repos/${owner}/${repo}`, {
                headers: this.auth.getHeaders(),
            });
            return response;
        });
    }

    async createIssue(owner: string, repo: string, title: string, body: string, labels: string[]): Promise<APIResponse> {
        return await step(`POST Create Issue: "${title}" inside "${owner}/${repo}"`, async () => {
            console.log(`https://api.github.com/repos/${owner}/${repo}/issues`);
            const response = await this.request.post(`https://api.github.com/repos/${owner}/${repo}/issues`, {
                headers: this.auth.getHeaders(),
                data: { title, body, labels }
            });
            await attachment(`Issue Creation Log - Status ${response.status()}`, await response.text(), 'application/json');
            return response;
        });
    }

    async getIssues(owner: string, repo: string): Promise<APIResponse> {
        return await step(`GET Issues List for Workspace: "${owner}/${repo}"`, async () => {
            const response = await this.request.get(`https://api.github.com/repos/${owner}/${repo}/issues`, {
                headers: this.auth.getHeaders(),
            });
            await attachment('Issues List Response', await response.text(), 'application/json');
            return response;
        });
    }
}
