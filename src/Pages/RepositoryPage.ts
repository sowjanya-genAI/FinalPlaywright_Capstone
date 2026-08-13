import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RepositoryPage extends BasePage {
    readonly globalHeaderPlusBtn = this.page.getByRole('button', { name: 'Create new...' });
    readonly newRepoDropdownOpt = this.page.getByRole('menuitem', { name: 'New repository' });
    readonly newrepodescriptionInput = this.page.getByRole('textbox', { name: 'Description' })
    readonly repoNameInput = this.page.getByRole('textbox', { name: 'Repository name *' });
    readonly initReadmeBtn = this.page.getByRole('button', { name: 'Add README' });
    readonly createRepoSubmitBtn = this.page.getByRole('button', { name: /^Create repository$/i });
    readonly fileTreeArea = this.page.locator('#repo-content-pjax-container');

    // Metadata / About Settings Locators
    readonly aboutSettingsGearIcon = this.page.getByRole('button', { name: 'Edit repository metadata' });
    readonly descriptionInput = this.page.getByRole('textbox', { name: 'Description' });
    readonly websiteInput = this.page.getByRole('textbox', { name: 'Website' });
    readonly topicsInput = this.page.getByRole('combobox', { name: 'Add topics' });
    readonly saveAboutChangesBtn = this.page.getByRole('button', { name: 'Save changes' });

    // Verification Assertions Locators
    private readonly readmeFileLink = this.page.getByRole('link', { name: 'README.md' });
    // Add File Control Locators
    private readonly addFileDropdownTrigger = this.page.getByRole('button', { name: /Add file/i });
    private readonly createNewFileOption = this.page.getByRole('menuitem', { name: /Create new file/i });

    // File Editor Input Locators
    private readonly fileNameInput = this.page.getByRole('textbox', { name: 'File name' });
    private readonly fileContentTextArea = this.page.locator('.cm-content'); // Standard GitHub Monaco/CodeMirror editor block

    // Commit Dialogue Locators
    private readonly openCommitDialogBtn = this.page.getByRole('button', { name: 'Commit changes...' });
    private readonly proposeChangesBtn = this.page.getByRole('button', { name: /^Propose changes$/i });
    private readonly createnewbranchRadioBtn = this.page.getByRole('radio', { name: 'Create a new branch for this commit and' });

    private readonly renderedDescription = (desc: string) => this.page.getByRole('paragraph').filter({ hasText: desc });
    private readonly renderedTopic = (topic: string) => this.page.getByRole('link', { name: `${topic}` });
    private readonly settingsTabLink = this.page.getByRole('link', { name: /Settings/i });

    // Danger Zone Deletion Elements
    private readonly deleteRepoButtonTrigger = this.page.getByRole('button', { name: /Delete this repository/i });
    private readonly passwordTextInput = this.page.getByRole('textbox', { name: 'Password' });
    private readonly confirmBtn = this.page.getByRole('button', { name: 'Confirm' });
    // Multi-Step Modal Dialog Selectors (GitHub UI Verification Sequence)
    private readonly firstAcknowledgeBtn = this.page.getByRole('button', { name: /I want to delete this repository/i });
    private readonly secondAcknowledgeBtn = this.page.getByRole('button', { name: /I have read and understand these effects/i });
    private readonly verificationTextInput = this.page.locator('input[aria-label*="type the name of the repository"], input[id$="verification_field"]');
    private readonly finalDeleteConfirmationBtn = this.page.locator('#repo-delete-proceed-button');

    // Post-Deletion Global Banner Target
    private readonly globalFlashMessageBanner = this.page.locator('.flash-messages, [role="alert"]');

    constructor(page: Page) {
        super(page);
    }

    async createNewRepositoryFromUI(name: string, desc: string) {
        await this.step(`Fill Repository details for name: ${name}`, async () => {
            await this.repoNameInput.fill(name);
            await this.newrepodescriptionInput.fill(desc)
            await this.initReadmeBtn.click();
            await this.createRepoSubmitBtn.scrollIntoViewIfNeeded();
            await expect(this.createRepoSubmitBtn, 'FAILED: The "Create repository" button was blocked or left disabled by background validation processing loops.').toBeEnabled({ timeout: 5000 });
            await this.createRepoSubmitBtn.focus();
            //await this.page.keyboard.press('Enter');
            await this.createRepoSubmitBtn.click({ force: true, timeout: 6000 });
        });
    }

    async updateMetadata(desc: string, url: string, topic: string) {
        await this.step('Update About metadata text fields and social topics', async () => {
            await this.aboutSettingsGearIcon.click();
            await this.descriptionInput.fill(desc);
            await this.websiteInput.fill(url);
            await this.topicsInput.fill(topic);
            await this.topicsInput.press('Enter');
            await this.saveAboutChangesBtn.click();
        });
    }

    // --- Smart Assertions ---
    async verifyRepositoryInitializedCleanly(repoName: string) {
        await this.step(`Assert repo metadata and files for: ${repoName}`, async () => {
            // Fixed: Moved custom messages into expect()
            await expect(this.page, `FAILED: Browser context failed to redirect to target repository main URL landing page for: ${repoName}`).toHaveURL(new RegExp(`.*/${repoName}$`));
            await expect(this.readmeFileLink, 'FAILED: Initialized file asset list failed to render structural README.md descriptor element file.').toBeVisible();
        });
    }

    async verifyMetadataUpdatedSuccessfully(desc: string, topic: string) {
        await this.step('Assert updated text description and social label properties', async () => {
            // Fixed: Moved custom messages into expect()
            await expect(this.renderedDescription(desc), `FAILED: About sidebar context profile layout failed to render updated description string parameter: "${desc}"`).toBeVisible();
            await expect(this.renderedTopic(topic), `FAILED: Social keywords tracking list did not register tag topic parameter node element value: "${topic}"`).toBeVisible();
        });
    }

    // --- Workflows ---
    async createNewFileInRepository(fileName: string, content: string) {
        await this.step(`Initialize dynamic new file wizard for: ${fileName}`, async () => {
            // 1. Open the "Add file" menu drop grid context
            await this.addFileDropdownTrigger.click();
            await this.createNewFileOption.click();

            // 2. Input target path title string
            await this.fileNameInput.fill(fileName);

            // 3. Populate file body area sequence data lines
            await this.fileContentTextArea.click();
            await this.fileContentTextArea.fill(content);

            // 4. Open and validate the commit settings overlay drawer
            await this.openCommitDialogBtn.click();
            await this.createnewbranchRadioBtn.check();
            // 5. Confirm and dispatch standard commit directly to main branch
            await expect(this.proposeChangesBtn, 'FAILED: The final commit confirmation button was disabled or blocked.').toBeEnabled();
            await this.proposeChangesBtn.click({ timeout: 2000 });
        });
    }

    async purgeAndRepositoryPermanently(fullRepoPath: string, owner: string, pwd: string) {
        await this.step(`Navigate to Danger Zone settings to delete repository: ${fullRepoPath}`, async () => {
            // 1. Enter the Repository administration configuration area
            await this.settingsTabLink.click();

            // 2. Scroll into view and engage deletion sequence trigger inside the Danger Zone
            await this.deleteRepoButtonTrigger.scrollIntoViewIfNeeded();
            await this.deleteRepoButtonTrigger.click();

            await this.firstAcknowledgeBtn.click();
            await this.secondAcknowledgeBtn.click();

            await this.verificationTextInput.fill(`${owner}/${fullRepoPath}`);

            // 6. Execute final deletion closure click execution
            await expect(this.finalDeleteConfirmationBtn, 'FAILED: Final deletion execution button was kept disabled; verification path string input mismatch.').toBeEnabled();
            await this.finalDeleteConfirmationBtn.click();

            await this.passwordTextInput.fill(pwd);
            await this.confirmBtn.click();

        });
    }

    // --- Smart Assertions ---

    async verifyRepositoryDeletionConfirmed() {
        await this.step('Assert main dashboard view updates and shows a successful deletion banner alert', async () => {
            // Ensure the browser safely returns to the user dashboard home base URL layout
            await expect(this.page, 'FAILED: Browser context failed to redirect back to the central dashboard index view following deletion.').toHaveURL(/https:\/\/github\.com\/?(dashboard)?/);

            // Look for the user-facing localized success banner notification
            await expect(
                this.globalFlashMessageBanner.first(),
                'FAILED: Expected confirmation message indicating successful repository removal was missing from the dashboard layout alerts.'
            ).toContainText(/was successfully deleted/i);
        });
    }

}