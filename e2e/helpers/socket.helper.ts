import { Page } from '@playwright/test';

export class SocketHelper {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async simulateDisconnect() {
    await this.page.evaluate(() => {
      // Assuming socket is attached to window for testing or accessible via a global store
      if ((window as any).socket) {
        (window as any).socket.disconnect();
      }
    });
  }

  async simulateReconnect() {
    await this.page.evaluate(() => {
      if ((window as any).socket) {
        (window as any).socket.connect();
      }
    });
  }

  async checkSocketStatus() {
    return await this.page.evaluate(() => {
      return (window as any).socket?.connected;
    });
  }
}
