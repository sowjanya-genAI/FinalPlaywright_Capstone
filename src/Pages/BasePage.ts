import { Page, test } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  protected async step(name: string, action: () => Promise<any>) {
    return test.step(name, async () => {
      console.log(`[STEP]: ${name}`);
      return await action();
    });
  }
}
