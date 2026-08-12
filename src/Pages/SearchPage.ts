import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SearchPage extends BasePage {
  // Locators
  private readonly globalSearchInput = this.page.getByRole('textbox', { name: 'Search GitHub' });
  private readonly sortDropdownTrigger = this.page.getByTestId('sort-button');
  private readonly mostStarsSortOption = this.page.getByText('Most stars');

  private readonly customizePinsBtn = this.page.getByRole('button', { name: /customize your pins/i });
  private readonly activeCheckedPins = this.page.getByRole('checkbox', { checked: true });
  private readonly filterReposInput = this.page.getByPlaceholder(/filter repositories/i);
  private readonly savePinsBtn = this.page.getByRole('button', { name: /save pins/i });

  // FIX: Identify the modal dialog viewport container safely
  private readonly pinCustomizerModal = this.page.getByRole('dialog', { name: 'Edit pinned items' });

  // 1. User-Facing Selectors (Accessibility Tree Anchors)
  private readonly userAvatarTrigger = this.page.getByRole('button', { name: /open user navigation menu/i });
  private readonly settingsMenuOption = this.page.getByRole('link', { name: 'Settings', exact: true })

  // Public Profile Form Fields
  private readonly nameInput = this.page.getByRole('textbox', { name: 'Name' });
  private readonly companyInput = this.page.getByRole('textbox', { name: 'Company' })
  private readonly locationInput = this.page.getByRole('textbox', { name: 'Location' })


  // Verification Assertions Locators
  private readonly primaryPinnedItem = this.page.locator('.pinned-item-list-item');

  // Interactions
  async executeGlobalSearch(query: string) {
    await this.step(`Query platform discovery catalog indexes for: ${query}`, async () => {
      const optimizedQuery = `${query} language:TypeScript`;

      await this.globalSearchInput.fill(optimizedQuery);
      await this.globalSearchInput.press('Enter');
      await this.sortDropdownTrigger.click();
      await this.mostStarsSortOption.click();
    });
  }

  async modifyShowcasePins(targetRepoName: string) {
    await this.step(`Adjust showcase pins to select: ${targetRepoName}`, async () => {
      await this.customizePinsBtn.click();

      // 2. FIX: Force Playwright to wait until the modal structure is stable and visible
      await expect(this.pinCustomizerModal.first(), 'FAILED: Customize pins modal configuration panel failed to open.').toBeVisible({ timeout: 5000 });

     const checkedCount = await this.activeCheckedPins.count();
      if (checkedCount > 0) {
        console.log(`[INFO]: Detected ${checkedCount} active pins. Clearing the first layout slot...`);
        const firstActivePin = this.activeCheckedPins.first();
        await firstActivePin.uncheck();
      } else {
        console.log('[INFO]: No active pinned elements found. Skipping clearance phase...');
      }
      await this.filterReposInput.fill(targetRepoName);

      const targetingCheckbox = this.page.getByRole('checkbox', { name: targetRepoName });;
      await targetingCheckbox.check();

      await this.savePinsBtn.click();
    });
  }

  // --- Smart Assertions ---
  async verifySearchQueryURLParameters() {
    await this.step('Assert search query navigation structure enforces proper target parameters', async () => {
      // FIX: Match the modern URL query string structure that handles inline language queries safely
      await expect(this.page, 'FAILED: Discovery engine query arguments failed to restrict platform search indexes to the explicit language: TypeScript.'
      ).toHaveURL(/q=.*language(%3A|:)TypeScript/i);

      // Verify that the sorting criteria matches Most Stars
      await expect(this.page,
        'FAILED: Discovery engine collection engine sorting parameters failed to rearrange catalog result lists matching the criteria: Most Stars.'
      ).toHaveURL(/s=stars/i);
    });
  }

  async verifyRepositoryIsPinned(repoName: string) {
    await this.step(`Assert profile landing view updates grid showcases to prioritize: ${repoName}`, async () => {
      // Fixed: Moved custom message into expect()
      await expect(this.primaryPinnedItem.first(), `FAILED: Public bio landing view custom display cards failed to prioritize or find target layout element container content row items for repo link: "${repoName}"`).toContainText(repoName);
    });
  }

  async navigateToProfileSettings() {
    await this.step('Navigate to the user Profile Settings configuration panel', async () => {
      // Open dropdown menu container
      await this.userAvatarTrigger.click();

      // Select settings layout choice
      await expect(this.settingsMenuOption, 'FAILED: Settings link was missing from the user navigation flyout menu.').toBeVisible({ timeout: 5000 });
      await this.settingsMenuOption.click();
    });
  }
  async verifyDisplayedProfileInformation(expectedName: string, expectedCompany: string, expectedLocation: string) {
    await this.step('Validate displayed user profile fields match authentication contexts', async () => {
      // 1. Verify routing redirected successfully to the profile edit zone
      await expect(this.page, 'FAILED: Main browser workspace layer failed to route to the /settings/profile view.').toHaveURL(/.*\/settings\/profile.*/);

      // 2. Validate user field data configurations capture input parameters exactly
      await expect(this.nameInput, `FAILED: Displayed profile "Name" did not match expected value: "${expectedName}"`).toHaveValue(expectedName);
      await expect(this.companyInput, `FAILED: Displayed profile "Company" did not match expected value: "${expectedCompany}"`).toHaveValue(expectedCompany);
      await expect(this.locationInput, `FAILED: Displayed profile "Location" did not match expected value: "${expectedLocation}"`).toHaveValue(expectedLocation);
    });
  }

}
