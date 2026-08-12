import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  private readonly globalHeaderPlusBtn = this.page.getByRole('button', { name: 'Create new...' });
  private readonly newRepoDropdownOpt = this.page.getByRole('menuitem', { name: 'New repository' });

  async navigateToNewRepoFlow() {
    await this.step('Navigate to New Repository Form via Global Header', async () => {
      await this.globalHeaderPlusBtn.click();
      await this.newRepoDropdownOpt.click();
    });
  }
}
