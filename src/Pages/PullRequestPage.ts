import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PullRequestPage extends BasePage {
  // Selectors
  private readonly prTitleInput = this.page.getByRole('textbox', { name: 'Add a title *' });
  private readonly submitPrBtn = this.page.getByRole('button', { name: /^Create pull request$/i });
  
   private readonly fileLines = this.page.locator('[data-line-number], [class*="blob-code"], .react-blob-print-hide');
  private readonly addLineCommentBtn = this.page.getByRole('button', { name: 'Add comment' });

  private readonly reviewCommentTextArea = this.page.locator('textarea[name="comment[body]"], [placeholder*="Leave a comment"]');
  private readonly startReviewBtn = this.page.getByRole('button', { name: /Start a review/i }).or(this.page.locator('button:has-text("Start a review")'));


  private readonly mergeMethodDropdown = this.page.getByRole('button',{name:'Select merge method'});
  private readonly squashMergeOption = this.page.getByRole('menuitemradio',{name:'Squash and merge'});
  private readonly squashMergeBtn = this.page.getByRole('button',{name:'Squash and merge'});
  private readonly confirmSquashMergeBtn = this.page.getByRole('button',{name:'Confirm squash and merge'});

  // Verification Assertions Locators
  private readonly openStateIndicator = this.page.getByText('Open', { exact: true }).first();
  private readonly mergedStateIndicator = this.page.getByText('Merged').first();
  private readonly deleteBranchBtn = this.page.getByRole('button', { name: 'Delete branch' });
  private readonly inlineReviewComment = (text: string) => this.page.getByText(`${text}`);

  // Interactions
  async initializePR(title: string) {
    await this.step('Initiate Pull Request branch comparison compilation view', async () => {
      await this.prTitleInput.waitFor({state:'visible'});
      await this.prTitleInput.fill(title);
      await this.submitPrBtn.click({timeout:8000});
    });
  }

  async addInlineReviewComment(comment: string) {
    await this.step('Target line item index on code diff panel to drop inline comment', async () => {
       // Pin down the first valid structural diff row sequence element
      const targetLine = this.fileLines.last();
      
      // Ensure the row is loaded and visible inside the viewport frame boundary
      await targetLine.scrollIntoViewIfNeeded();
      await expect(targetLine, 'FAILED: Code layout diff rows failed to render or load cleanly.').toBeVisible({ timeout: 5000 });
      
      // Hover over the specific target code line to reveal the hidden comment insertion trigger
      await targetLine.hover();
      await targetLine.click();
      // Select and engage the hover add button item
      const commentTrigger = this.addLineCommentBtn.first();
      await commentTrigger.waitFor({ state: 'visible', timeout: 5000 });
      await commentTrigger.click();
      await this.reviewCommentTextArea.fill(comment);
      await this.startReviewBtn.click();
    });
  }

  async executeSquashMerge() {
    await this.step('Perform squash-and-merge execution closing target PR', async () => {
      await this.mergeMethodDropdown.click();
      await this.squashMergeOption.click();
      await this.squashMergeBtn.click();
      await this.confirmSquashMergeBtn.click();
    });
  }
  // --- Smart Assertions ---
  async verifyPullRequestIsOpen() {
    await this.step('Assert Pull Request initialized cleanly in Open execution status', async () => {
      await this.openStateIndicator.waitFor({ state: 'visible', timeout: 4000 });
      await expect(this.openStateIndicator, 'FAILED: The pull request code branch comparison sequence did not transition into an active "Open" status context state marker.').toBeVisible();
    });
  }

  async verifyInlineCommentVisible(expectedText: string) {
    await this.step('Assert targeted code array diff displays the review message block line', async () => {
      // Fixed: Moved custom message into expect()
      await expect(this.inlineReviewComment(expectedText), `FAILED: Code review workspace engine failed to append evaluation text comment node element under modified row delta lines: "${expectedText}"`).toBeVisible();
    });
  }

  async verifyPullRequestMergedCleanly() {
    await this.step('Assert PR successfully converts into Merged state with teardown hooks available', async () => {
      // Fixed: Moved custom messages into expect()
      await expect(this.mergedStateIndicator, 'FAILED: Pull Request pipeline transaction processing failed to finalize branch and resolve lifecycle to a "Merged" layout color status.').toBeVisible();
      await expect(this.deleteBranchBtn, 'FAILED: Repository feature execution management failed to construct the post-merge context action choice element trigger link: "Delete branch".').toBeVisible();
    });
  }

}
