import { test, expect } from '../fixtures/test-fixtures';

test.describe('Manager Review Flow', () => {
  test('should approve a candidate after review', async ({ reviewPage, page }) => {
    // Login as manager first
    await reviewPage.goto();

    await expect(reviewPage.reviewList).toBeVisible();
    await reviewPage.selectCandidate('John Doe');

    // Check if AI summary is visible
    await expect(page.locator('text=AI Evaluation Summary')).toBeVisible();

    // Submit approval
    await reviewPage.submitReview('approve', 'Excellent performance in coding round.');

    // Verify success toast/message
    await expect(page.locator('text=Review submitted successfully')).toBeVisible();
  });
});
