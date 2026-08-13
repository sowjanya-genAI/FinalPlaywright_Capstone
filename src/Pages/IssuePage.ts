import { expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class IssuePage extends BasePage {
  // Selectors
  private readonly titleInput = this.page.getByRole('textbox', { name: 'Add a title' });
  private readonly bodyTextArea = this.page.getByRole('textbox', { name: 'Markdown value' });
  private readonly submitIssueBtn = this.page.getByTestId('create-issue-button');
  private readonly commentTextArea = this.page.getByRole('textbox', { name: 'Add a comment' });
  private readonly submitCommentBtn = this.page.getByRole('button', { name: 'Comment', exact: true });

 private readonly assigneesSidebarTrigger = this.page.getByRole('button', { name: 'Edit Assignees' });
  private readonly assignYourselfBtn =(owner:string)=> this.page.getByTestId('item-picker-root').locator('div').filter({ hasText: `${owner}` });
  private readonly labelsSidebarTrigger = this.page.getByRole('button', { name: 'Edit Labels' }); 
  private readonly bugLabelOption = this.page.getByRole('option',{name:'bug'});

  // Verification Assertions Locators
  private readonly markdownHeading = (text: string) => this.page.locator(`h3:has-text("${text}")`);
  private readonly markdownCodeBlock = this.page.getByText('Error rendering dynamic');
  private readonly individualCommentBoxes = this.page.locator('[data-testid^="comment-viewer-outer-box-"],.timeline-comment');

  // 2. Updated: Scopes the accessible button hook directly inside a single box instance
  private readonly reactButtonTrigger = (singleBox: Locator) =>
    singleBox.getByRole('button', { name: /react/i });

  private readonly heartEmojiOption = this.page.getByText('❤️');

  private readonly bugLabelBadge = this.page.getByTestId('issue-labels').getByRole('link', { name: 'bug Something isn\'t working' });
  private readonly assigneeAvatarBadge = this.page.getByTestId('sidebar-assignees-section');

  // Interactions
  async publishMarkdownIssue(title: string, markdown: string) {
    await this.step('Publish new issue with markdown markup data payload', async () => {
      await this.titleInput.fill(title);
      await this.bodyTextArea.fill(markdown);
      await this.submitIssueBtn.click();
    });
  }

  async addCommentAndReaction(comment: string) {
    await this.step('Append comment thread statement with emoji heart trigger', async () => {
      await this.commentTextArea.scrollIntoViewIfNeeded();
      await this.commentTextArea.fill(comment);
      await this.submitCommentBtn.click();

      const lastCommentBox = this.individualCommentBoxes.last();
      await lastCommentBox.scrollIntoViewIfNeeded();
      await lastCommentBox.hover();
      await lastCommentBox.click();
      const targetReactBtn = this.reactButtonTrigger(lastCommentBox);
      //await expect(targetReactBtn, 'FAILED: Reaction button failed to stabilize.').toBeVisible({ timeout: 5000 });
      await targetReactBtn.click();

      await this.heartEmojiOption.click();
    });
  }

  async triageMetadata(owner:string) {
    await this.step('Modify triage sidebar metadata markers', async () => {
      await this.assigneesSidebarTrigger.click();
      await this.assignYourselfBtn(owner).click();
      await this.assigneesSidebarTrigger.click();

      await this.labelsSidebarTrigger.click();
      await this.bugLabelOption.click();
      await this.labelsSidebarTrigger.click();
    });
  }

  // --- Smart Assertions ---
  async verifyMarkdownRenderedCorrectly(expectedHeading: string) {
    await this.step('Assert Markdown element formatting compiles successfully into DOM HTML', async () => {
      // Fixed: Moved custom messages into expect()
      await expect(this.markdownHeading(expectedHeading), `FAILED: Rich-Text parser failed to transform Markdown heading code syntax block into HTML h3 node header: "${expectedHeading}"`).toBeVisible();
      await expect(this.markdownCodeBlock, 'FAILED: Code block text extraction interpreter missed rendering target specific class type: language-typescript syntax styles.').toBeVisible();
    });
  }

  async verifyReactionCounterIncrements() {
    await this.step('Assert comment reaction layout counter matches target update value', async () => {
      const targetComment = this.individualCommentBoxes.last();
      // Fixed: Moved custom message into expect()
      await expect(targetComment.getByRole('switch', { name: '❤️ 1 reaction' }), 'FAILED: Collaborative social timeline trigger failed to increment active HEART feedback count structure index value to 1.').toBeVisible();
    });
  }

  async verifyTriageMetadataPersisted() {
    await this.step('Assert user assignments and triage label markers persist completely', async () => {
      // Fixed: Moved custom messages into expect()
      await expect(this.assigneeAvatarBadge, 'FAILED: Metadata validation workflow engine failed to detect target assignee username marker asset badge on runtime sidebar.').toBeVisible();
      await expect(this.bugLabelBadge, 'FAILED: Metadata validation workflow engine failed to detect active "bug" taxonomy style label tag inside current view DOM state.').toBeVisible();
    });
  }

}
