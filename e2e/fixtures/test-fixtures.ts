import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { AssessmentPage } from '../pages/assessment.page';
import { ReviewPage } from '../pages/review.page';

type MyFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  assessmentPage: AssessmentPage;
  reviewPage: ReviewPage;
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  assessmentPage: async ({ page }, use) => {
    await use(new AssessmentPage(page));
  },
  reviewPage: async ({ page }, use) => {
    await use(new ReviewPage(page));
  },
});

export { expect } from '@playwright/test';
