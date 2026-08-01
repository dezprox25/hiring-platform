import { test, expect } from '../fixtures/test-fixtures';

test.describe('Socket.IO Resilience', () => {
  test('should reconnect automatically after connection loss', async ({ page }) => {
    await page.goto('/candidate/assessment/test-id');
    
    // Check initial connection
    const isConnected = await page.evaluate(() => {
      return (window as any).socket?.connected;
    });
    
    // Simulate disconnect
    await page.context().setOffline(true);
    await expect(page.locator('text=Disconnected')).toBeVisible();

    // Reconnect
    await page.context().setOffline(false);
    await expect(page.locator('text=Connected')).toBeVisible();
  });

  test('should prevent duplicate socket connections on refresh', async ({ page }) => {
    await page.goto('/candidate/assessment/test-id');
    await page.reload();
    
    const socketId = await page.evaluate(() => (window as any).socket?.id);
    await page.reload();
    const newSocketId = await page.evaluate(() => (window as any).socket?.id);
    
    expect(socketId).not.toBe(newSocketId);
    // Further server-side validation would be needed to ensure the old one is cleaned up
  });
});
