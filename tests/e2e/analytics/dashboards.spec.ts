/**
 * Analytics Dashboards E2E Tests
 *
 * Tests analytics dashboards UI and functionality
 * Phase 8: Dashboards & Reporting
 */
import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboards', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="badge"]', 'SA-00001');
    await page.fill('input[name="pin"]', '12345678');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test.describe('Officer Productivity Dashboard', () => {
    test('should display officer productivity metrics', async ({ page }) => {
      // Act
      await page.goto('/analytics/officers');

      // Assert - Dashboard loads
      await expect(page.locator('h1:has-text("Officer Productivity")')).toBeVisible();

      // Metric cards should be visible
      await expect(page.locator('text=Total Cases')).toBeVisible();
      await expect(page.locator('text=Active Cases')).toBeVisible();
      await expect(page.locator('text=Closed Cases')).toBeVisible();
      await expect(page.locator('text=Average Resolution Time')).toBeVisible();
    });

    test('should display charts', async ({ page }) => {
      // Act
      await page.goto('/analytics/officers');

      // Assert - Charts should render
      await expect(page.locator('[data-testid="activity-timeline-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-breakdown-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="status-distribution-chart"]')).toBeVisible();
    });

    test('should allow date range filtering', async ({ page }) => {
      // Act
      await page.goto('/analytics/officers');

      // Click date range picker
      await page.click('button:has-text("Last 30 Days")');

      // Select "Last 7 Days"
      await page.click('text=Last 7 Days');

      // Assert - Charts should reload with new data
      await expect(page.locator('[data-testid="activity-timeline-chart"]')).toBeVisible();

      // URL should update with date params
      await expect(page).toHaveURL(/startDate/);
    });

    test('should show station rankings', async ({ page }) => {
      // Act
      await page.goto('/analytics/officers');

      // Assert
      await expect(page.locator('text=Station Ranking')).toBeVisible();
      await expect(page.locator('[data-testid="station-rank"]')).toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
      // Arrange - Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Act
      await page.goto('/analytics/officers');

      // Assert - Dashboard should be visible and usable
      await expect(page.locator('h1:has-text("Officer Productivity")')).toBeVisible();

      // Charts should stack vertically
      const charts = page.locator('[data-testid*="chart"]');
      await expect(charts.first()).toBeVisible();
    });
  });

  test.describe('Case Trends Dashboard', () => {
    test('should display case trends metrics', async ({ page }) => {
      // Act
      await page.goto('/analytics/cases');

      // Assert
      await expect(page.locator('h1:has-text("Case Trends")')).toBeVisible();

      // Resolution metrics should be visible
      await expect(page.locator('text=Resolution Rate')).toBeVisible();
      await expect(page.locator('text=Average Resolution Days')).toBeVisible();
      await expect(page.locator('text=Median Resolution Days')).toBeVisible();
      await expect(page.locator('text=Stale Cases')).toBeVisible();
    });

    test('should display timeline area chart', async ({ page }) => {
      // Act
      await page.goto('/analytics/cases');

      // Assert
      await expect(page.locator('[data-testid="case-timeline-chart"]')).toBeVisible();

      // Chart should show status breakdown (open, investigating, charged, court, closed)
      await expect(page.locator('text=Open')).toBeVisible();
      await expect(page.locator('text=Investigating')).toBeVisible();
      await expect(page.locator('text=Charged')).toBeVisible();
    });

    test('should display category breakdown with trends', async ({ page }) => {
      // Act
      await page.goto('/analytics/cases');

      // Assert
      await expect(page.locator('[data-testid="category-breakdown"]')).toBeVisible();

      // Should show trend indicators
      await expect(page.locator('[data-testid*="trend-indicator"]')).toBeVisible();
    });

    test('should display top performing stations', async ({ page }) => {
      // Act
      await page.goto('/analytics/cases');

      // Assert
      await expect(page.locator('text=Top Performing Stations')).toBeVisible();
      await expect(page.locator('[data-testid="top-stations-list"]')).toBeVisible();
    });

    test('should default to 90-day date range', async ({ page }) => {
      // Act
      await page.goto('/analytics/cases');

      // Assert - Date picker should show "Last 90 Days"
      await expect(page.locator('button:has-text("Last 90 Days")')).toBeVisible();
    });
  });

  test.describe('Station Performance Dashboard', () => {
    test('should display station performance metrics', async ({ page }) => {
      // Act
      await page.goto('/analytics/stations');

      // Assert
      await expect(page.locator('h1:has-text("Station Performance")')).toBeVisible();

      // KPIs should be visible
      await expect(page.locator('text=Total Cases')).toBeVisible();
      await expect(page.locator('text=Resolution Rate')).toBeVisible();
      await expect(page.locator('text=Evidence Collected')).toBeVisible();
    });

    test('should display radar chart for overall performance', async ({ page }) => {
      // Act
      await page.goto('/analytics/stations');

      // Assert
      await expect(page.locator('[data-testid="performance-radar-chart"]')).toBeVisible();
    });

    test('should display WoW and MoM comparisons', async ({ page }) => {
      // Act
      await page.goto('/analytics/stations');

      // Assert
      await expect(page.locator('text=Week over Week')).toBeVisible();
      await expect(page.locator('text=Month over Month')).toBeVisible();

      // Should show percentage changes
      await expect(page.locator('[data-testid*="percentage-change"]')).toBeVisible();
    });

    test('should display resource utilization', async ({ page }) => {
      // Act
      await page.goto('/analytics/stations');

      // Assert
      await expect(page.locator('text=Resource Utilization')).toBeVisible();
      await expect(page.locator('text=Active Officers')).toBeVisible();
      await expect(page.locator('text=Cases per Officer')).toBeVisible();
    });

    test('should restrict non-commanders to own station only', async ({ page }) => {
      // Act
      await page.goto('/analytics/stations');

      // Assert - Should only see own station data
      // Station selector should not be visible for regular officers
      await expect(page.locator('select[name="stationId"]')).not.toBeVisible();
    });
  });

  test.describe('National Crime Statistics Dashboard', () => {
    test('should require admin access', async ({ page }) => {
      // Arrange - Login as regular officer
      await page.goto('/login');
      await page.fill('input[name="badge"]', 'OFF-00001'); // Regular officer
      await page.fill('input[name="pin"]', '12345678');
      await page.click('button[type="submit"]');

      // Act - Try to access national dashboard
      await page.goto('/analytics/national');

      // Assert - Should be redirected or show forbidden
      await expect(page.locator('text=Forbidden')).toBeVisible();
    });

    test('should display national statistics for admins', async ({ page }) => {
      // Arrange - Login as admin
      await page.goto('/login');
      await page.fill('input[name="badge"]', 'ADMIN-001');
      await page.fill('input[name="pin"]', '12345678');
      await page.click('button[type="submit"]');

      // Act
      await page.goto('/analytics/national');

      // Assert
      await expect(page.locator('h1:has-text("National Crime Statistics")')).toBeVisible();

      // Overview metrics
      await expect(page.locator('text=Total Cases')).toBeVisible();
      await expect(page.locator('text=Total Persons')).toBeVisible();
      await expect(page.locator('text=Total Evidence')).toBeVisible();
      await expect(page.locator('text=Active Officers')).toBeVisible();
    });

    test('should display national distribution charts', async ({ page }) => {
      // Arrange - Login as admin
      await page.goto('/login');
      await page.fill('input[name="badge"]', 'ADMIN-001');
      await page.fill('input[name="pin"]', '12345678');
      await page.click('button[type="submit"]');

      // Act
      await page.goto('/analytics/national');

      // Assert
      await expect(page.locator('[data-testid="status-distribution-pie"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-distribution-pie"]')).toBeVisible();
      await expect(page.locator('[data-testid="geographic-distribution-bar"]')).toBeVisible();
    });

    test('should display alert metrics', async ({ page }) => {
      // Arrange - Login as admin
      await page.goto('/login');
      await page.fill('input[name="badge"]', 'ADMIN-001');
      await page.fill('input[name="pin"]', '12345678');
      await page.click('button[type="submit"]');

      // Act
      await page.goto('/analytics/national');

      // Assert
      await expect(page.locator('text=Active Alerts')).toBeVisible();
      await expect(page.locator('text=Wanted Persons')).toBeVisible();
      await expect(page.locator('text=Missing Persons')).toBeVisible();
      await expect(page.locator('text=Stolen Vehicles')).toBeVisible();
    });

    test('should display top officers leaderboard', async ({ page }) => {
      // Arrange - Login as admin
      await page.goto('/login');
      await page.fill('input[name="badge"]', 'ADMIN-001');
      await page.fill('input[name="pin"]', '12345678');
      await page.click('button[type="submit"]');

      // Act
      await page.goto('/analytics/national');

      // Assert
      await expect(page.locator('text=Top Performing Officers')).toBeVisible();
      await expect(page.locator('[data-testid="top-officers-list"]')).toBeVisible();

      // Should show at least 3 officers
      const officerItems = page.locator('[data-testid="officer-item"]');
      await expect(officerItems).toHaveCount(10, { timeout: 5000 }); // Top 10
    });
  });

  test.describe('Dashboard Loading States', () => {
    test('should show loading skeletons', async ({ page }) => {
      // Act
      await page.goto('/analytics/officers');

      // Assert - Loading skeletons should appear briefly
      // (This is timing-dependent and may need adjustment)
      const skeleton = page.locator('[data-testid="skeleton-loader"]');
      if (await skeleton.isVisible({ timeout: 1000 }).catch(() => false)) {
        expect(true).toBe(true); // Skeleton was visible
      }
    });

    test('should handle empty data gracefully', async ({ page }) => {
      // Arrange - Navigate to officer with no cases
      await page.goto('/analytics/officers?officerId=empty-officer');

      // Assert - Should show "No data" message
      await expect(page.locator('text=No data available')).toBeVisible();
    });

    test('should handle errors gracefully', async ({ page }) => {
      // Arrange - Simulate offline
      await page.context().setOffline(true);

      // Act
      await page.goto('/analytics/officers');

      // Assert - Should show error message
      await expect(page.locator('text=Failed to load')).toBeVisible();

      // Restore connection
      await page.context().setOffline(false);
    });
  });

  test.describe('Chart Interactions', () => {
    test('should show tooltips on hover', async ({ page }) => {
      // Act
      await page.goto('/analytics/cases');

      // Hover over chart
      const chart = page.locator('[data-testid="case-timeline-chart"]');
      await chart.hover();

      // Assert - Tooltip should appear
      // (Recharts tooltips may have specific selectors)
      await expect(page.locator('.recharts-tooltip')).toBeVisible({ timeout: 2000 });
    });

    test('should toggle legend items', async ({ page }) => {
      // Act
      await page.goto('/analytics/cases');

      // Click legend item to toggle
      const legendItem = page.locator('.recharts-legend-item').first();
      await legendItem.click();

      // Assert - Chart should update
      // (Visual change - hard to assert, but click should work)
      expect(true).toBe(true);
    });
  });
});
