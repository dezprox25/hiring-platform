import { Page, Locator } from '@playwright/test';

export class ReviewPage {
  readonly page: Page;
  readonly reviewList: Locator;
  readonly candidateRow: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly feedbackTextarea: Locator;
  readonly submitFeedbackButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.reviewList = page.locator('table');
    this.candidateRow = page.locator('tr').filter({ hasText: 'Pending Review' });
    this.approveButton = page.locator('button:has-text("Approve")');
    this.rejectButton = page.locator('button:has-text("Reject")');
    this.feedbackTextarea = page.getByTestId('manager-feedback');
    this.submitFeedbackButton = page.getByTestId('finalize-review-button');
  }

  async goto() {
    await this.page.goto('/manager/reviews');
  }

  async selectCandidate(name: string) {
    await this.page.locator(`text=${name}`).click();
  }

  async submitReview(status: 'approve' | 'reject', feedback: string) {
    if (status === 'approve') {
      await this.approveButton.click();
    } else {
      await this.rejectButton.click();
    }
    await this.feedbackTextarea.fill(feedback);
    await this.submitFeedbackButton.click();
  }
}
