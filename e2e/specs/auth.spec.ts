import { test, expect } from '../fixtures/test-fixtures';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should show error for invalid credentials', async ({ loginPage }) => {
    await loginPage.login('invalid@example.com', 'wrongpassword');
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Login failed');
  });

  test('should redirect to login for protected routes when not authenticated', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  // These tests would require valid credentials to pass
  // In a real CI environment, these would be provided via environment variables
  test.skip('should login successfully as admin', async ({ loginPage, page }) => {
    await loginPage.login(process.env.TEST_ADMIN_EMAIL!, process.env.TEST_ADMIN_PASSWORD!);
    await expect(page).toHaveURL(/\/admin/);
  });

  test.skip('should logout successfully', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(process.env.TEST_ADMIN_EMAIL!, process.env.TEST_ADMIN_PASSWORD!);
    await dashboardPage.logout();
    await expect(page).toHaveURL(/\/login/);
  });
});
