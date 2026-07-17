import { Page, Locator } from '@playwright/test';

export class AssessmentPage {
  readonly page: Page;
  readonly startButton: Locator;
  readonly nextButton: Locator;
  readonly submitButton: Locator;
  readonly timer: Locator;
  readonly mcqOptions: Locator;
  readonly codeEditor: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startButton = page.locator('button:has-text("Start Assessment")');
    this.nextButton = page.locator('button:has-text("Next")');
    this.submitButton = page.locator('button:has-text("Submit")');
    this.timer = page.getByTestId('assessment-timer');
    this.mcqOptions = page.locator('button').filter({ hasText: /^[A-D]$/ }); // Adjusting for actual UI structure
    this.codeEditor = page.locator('.monaco-editor');
  }

  async start() {
    await this.startButton.click();
  }

  async answerMCQ(optionIndex: number) {
    await this.mcqOptions.nth(optionIndex).click();
    await this.nextButton.click();
  }

  async typeInCodeEditor(code: string) {
    await this.codeEditor.click();
    await this.page.keyboard.type(code);
  }

  async submit() {
    await this.submitButton.click();
    await this.page.locator('button:has-text("Confirm")').click();
  }
}
