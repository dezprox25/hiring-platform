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

  test('should login successfully as admin', async ({ loginPage, page }) => {
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@dezprox.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(email, password);
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should logout successfully', async ({ loginPage, dashboardPage, page }) => {
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@dezprox.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(email, password);
    await dashboardPage.logout();
    await expect(page).toHaveURL(/\/login/);
  });
});
