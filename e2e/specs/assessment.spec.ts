import { test, expect } from '../fixtures/test-fixtures';

test.describe('Candidate Assessment Flow', () => {
  test('should complete a full assessment flow', async ({ page, assessmentPage }) => {
    // In a real test, we would log in as a candidate first
    await page.goto('/candidate/assessment/test-id');

    // 1. Start Assessment
    await assessmentPage.start();
    await expect(page).toHaveURL(/.*round=1/);

    // 2. MCQ Round
    await expect(assessmentPage.timer).toBeVisible();
    await assessmentPage.answerMCQ(0);
    await assessmentPage.answerMCQ(1);
    
    // 3. Transitions to next round
    await expect(page).toHaveURL(/.*round=2/);

    // 4. Coding Round
    await expect(assessmentPage.codeEditor).toBeVisible();
    await assessmentPage.typeInCodeEditor('function test() { return true; }');
    
    // 5. Final Submission
    await assessmentPage.submit();
    await expect(page).toHaveURL(/\/candidate\/results/);
    await expect(page.locator('text=Assessment Completed')).toBeVisible();
  });

  test('should maintain socket connection and handle reconnect', async ({ page, assessmentPage }) => {
    await page.goto('/candidate/assessment/test-id');
    await assessmentPage.start();

    // Simulate network disconnect
    await page.context().setOffline(true);
    await expect(page.locator('text=Disconnected')).toBeVisible();

    // Reconnect
    await page.context().setOffline(false);
    await expect(page.locator('text=Connected')).toBeVisible();
    await expect(assessmentPage.timer).toBeVisible();
  });
});
