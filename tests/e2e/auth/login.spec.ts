/**
 * Authentication E2E Tests
 *
 * Tests login, logout, account locking, and PIN validation
 * Critical security flow testing
 */
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Assert
    await expect(page).toHaveTitle(/CRMS/);
    await expect(page.locator('input[name="badge"]')).toBeVisible();
    await expect(page.locator('input[name="pin"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Arrange
    const badge = 'SA-00001';
    const pin = '12345678';

    // Act
    await page.fill('input[name="badge"]', badge);
    await page.fill('input[name="pin"]', pin);
    await page.click('button[type="submit"]');

    // Assert - Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Should show user info
    await expect(page.locator(`text=${badge}`)).toBeVisible();
  });

  test('should show error for invalid badge', async ({ page }) => {
    // Arrange
    const invalidBadge = 'INVALID-BADGE';
    const pin = '12345678';

    // Act
    await page.fill('input[name="badge"]', invalidBadge);
    await page.fill('input[name="pin"]', pin);
    await page.click('button[type="submit"]');

    // Assert - Should show error
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error for invalid PIN', async ({ page }) => {
    // Arrange
    const badge = 'SA-00001';
    const wrongPin = '99999999';

    // Act
    await page.fill('input[name="badge"]', badge);
    await page.fill('input[name="pin"]', wrongPin);
    await page.click('button[type="submit"]');

    // Assert - Should show error
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should require both badge and PIN', async ({ page }) => {
    // Act - Try to submit without filling fields
    await page.click('button[type="submit"]');

    // Assert - Should show validation errors
    await expect(page.locator('text=required')).toBeVisible();
  });

  test('should mask PIN input', async ({ page }) => {
    // Arrange
    const pinInput = page.locator('input[name="pin"]');

    // Act
    await pinInput.fill('12345678');

    // Assert - Input type should be password
    await expect(pinInput).toHaveAttribute('type', 'password');
  });

  test('should lock account after 5 failed attempts', async ({ page }) => {
    // Arrange
    const badge = 'TEST-LOCK';
    const wrongPin = '99999999';

    // Act - Try 5 times with wrong PIN
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="badge"]', badge);
      await page.fill('input[name="pin"]', wrongPin);
      await page.click('button[type="submit"]');

      // Wait for error to appear
      await page.waitForSelector('text=Invalid credentials', { timeout: 5000 });

      // Clear form for next attempt
      await page.fill('input[name="badge"]', '');
      await page.fill('input[name="pin"]', '');
    }

    // Assert - 6th attempt should show account locked
    await page.fill('input[name="badge"]', badge);
    await page.fill('input[name="pin"]', wrongPin);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Account is locked')).toBeVisible();
  });

  test('should not allow login for inactive accounts', async ({ page }) => {
    // Arrange
    const inactiveBadge = 'INACTIVE-001';
    const pin = '12345678';

    // Act
    await page.fill('input[name="badge"]', inactiveBadge);
    await page.fill('input[name="pin"]', pin);
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('text=Account is inactive')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should logout successfully', async ({ page }) => {
    // Arrange - Login first
    await page.fill('input[name="badge"]', 'SA-00001');
    await page.fill('input[name="pin"]', '12345678');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Act - Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Logout');

    // Assert - Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('input[name="badge"]')).toBeVisible();
  });

  test('should redirect to login when accessing protected routes without auth', async ({ page }) => {
    // Act - Try to access dashboard without login
    await page.goto('/dashboard');

    // Assert - Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should maintain session after page refresh', async ({ page }) => {
    // Arrange - Login
    await page.fill('input[name="badge"]', 'SA-00001');
    await page.fill('input[name="pin"]', '12345678');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Act - Refresh page
    await page.reload();

    // Assert - Should still be logged in
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show loading state during login', async ({ page }) => {
    // Arrange
    await page.fill('input[name="badge"]', 'SA-00001');
    await page.fill('input[name="pin"]', '12345678');

    // Act
    await page.click('button[type="submit"]');

    // Assert - Button should show loading state
    await expect(page.locator('button[type="submit"][disabled]')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Arrange - Simulate offline
    await page.context().setOffline(true);

    await page.fill('input[name="badge"]', 'SA-00001');
    await page.fill('input[name="pin"]', '12345678');

    // Act
    await page.click('button[type="submit"]');

    // Assert - Should show error message
    await expect(page.locator('text=Network error')).toBeVisible();

    // Restore connection
    await page.context().setOffline(false);
  });

  test('should enforce minimum PIN length (8 characters)', async ({ page }) => {
    // Arrange
    const badge = 'SA-00001';
    const shortPin = '1234'; // Less than 8

    // Act
    await page.fill('input[name="badge"]', badge);
    await page.fill('input[name="pin"]', shortPin);
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('text=PIN must be at least 8 characters')).toBeVisible();
  });

  test('should navigate to PIN change page from dashboard', async ({ page }) => {
    // Arrange - Login first
    await page.fill('input[name="badge"]', 'SA-00001');
    await page.fill('input[name="pin"]', '12345678');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Act - Navigate to PIN change
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Change PIN');

    // Assert
    await expect(page).toHaveURL(/\/change-pin/);
    await expect(page.locator('input[name="oldPin"]')).toBeVisible();
    await expect(page.locator('input[name="newPin"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPin"]')).toBeVisible();
  });
});

test.describe('PIN Change', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="badge"]', 'SA-00001');
    await page.fill('input[name="pin"]', '12345678');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to PIN change page
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Change PIN');
  });

  test('should change PIN successfully', async ({ page }) => {
    // Arrange
    const oldPin = '12345678';
    const newPin = '87654321';

    // Act
    await page.fill('input[name="oldPin"]', oldPin);
    await page.fill('input[name="newPin"]', newPin);
    await page.fill('input[name="confirmPin"]', newPin);
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('text=PIN changed successfully')).toBeVisible();
  });

  test('should reject weak PINs (sequential)', async ({ page }) => {
    // Arrange
    const oldPin = '12345678';
    const sequentialPin = '12345678'; // Sequential digits

    // Act
    await page.fill('input[name="oldPin"]', oldPin);
    await page.fill('input[name="newPin"]', sequentialPin);
    await page.fill('input[name="confirmPin"]', sequentialPin);
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('text=PIN cannot contain sequential digits')).toBeVisible();
  });

  test('should reject weak PINs (repeating)', async ({ page }) => {
    // Arrange
    const oldPin = '12345678';
    const repeatingPin = '11111111'; // All same digits

    // Act
    await page.fill('input[name="oldPin"]', oldPin);
    await page.fill('input[name="newPin"]', repeatingPin);
    await page.fill('input[name="confirmPin"]', repeatingPin);
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('text=PIN cannot be all the same digit')).toBeVisible();
  });

  test('should require PIN confirmation to match', async ({ page }) => {
    // Arrange
    const oldPin = '12345678';
    const newPin = '87654321';
    const wrongConfirm = '11223344';

    // Act
    await page.fill('input[name="oldPin"]', oldPin);
    await page.fill('input[name="newPin"]', newPin);
    await page.fill('input[name="confirmPin"]', wrongConfirm);
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('text=PINs do not match')).toBeVisible();
  });

  test('should reject incorrect old PIN', async ({ page }) => {
    // Arrange
    const wrongOldPin = '99999999';
    const newPin = '87654321';

    // Act
    await page.fill('input[name="oldPin"]', wrongOldPin);
    await page.fill('input[name="newPin"]', newPin);
    await page.fill('input[name="confirmPin"]', newPin);
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('text=Current PIN is incorrect')).toBeVisible();
  });
});
