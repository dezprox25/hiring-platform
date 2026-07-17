import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly sidebar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userMenu = page.locator('button[aria-haspopup="menu"]');
    this.logoutButton = page.locator('text=Log out');
    this.sidebar = page.locator('aside');
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
  }

  async getRolePath(role: string) {
    return `/${role}`;
  }
}
