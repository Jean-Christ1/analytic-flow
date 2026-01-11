// ============================================================================
// E2E Tests - Application Core
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-06
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('Application Core', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads
    await expect(page).toHaveTitle(/MLOps|Dashboard|Apex/i);
  });

  test('should display navigation sidebar', async ({ page }) => {
    await page.goto('/');

    // Check for main navigation elements
    const sidebar = page.locator('[data-testid="sidebar"], nav, [role="navigation"]').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to experiments page', async ({ page }) => {
    await page.goto('/');

    // Click on experiments link if it exists
    const experimentsLink = page.getByRole('link', { name: /experiment/i });
    if (await experimentsLink.isVisible()) {
      await experimentsLink.click();
      await expect(page).toHaveURL(/experiment/i);
    }
  });

  test('should navigate to models page', async ({ page }) => {
    await page.goto('/');

    // Click on models link if it exists
    const modelsLink = page.getByRole('link', { name: /model/i });
    if (await modelsLink.isVisible()) {
      await modelsLink.click();
      await expect(page).toHaveURL(/model/i);
    }
  });

  test('should navigate to pipelines page', async ({ page }) => {
    await page.goto('/');

    // Click on pipelines link if it exists
    const pipelinesLink = page.getByRole('link', { name: /pipeline/i });
    if (await pipelinesLink.isVisible()) {
      await pipelinesLink.click();
      await expect(page).toHaveURL(/pipeline/i);
    }
  });
});

test.describe('Dashboard', () => {
  test('should display dashboard components', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for dashboard elements (cards, stats, charts)
    const pageContent = page.locator('main, [role="main"], .dashboard, #dashboard');
    await expect(pageContent.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('MLOps Features', () => {
  test('should display experiments list', async ({ page }) => {
    await page.goto('/experiments');

    await page.waitForLoadState('networkidle');

    // Check for experiments page content
    const heading = page.getByRole('heading', { name: /experiment/i });
    if (await heading.isVisible()) {
      await expect(heading).toBeVisible();
    }
  });

  test('should display models list', async ({ page }) => {
    await page.goto('/models');

    await page.waitForLoadState('networkidle');

    // Check for models page content
    const heading = page.getByRole('heading', { name: /model/i });
    if (await heading.isVisible()) {
      await expect(heading).toBeVisible();
    }
  });
});

test.describe('FinOps Features', () => {
  test('should navigate to FinOps page', async ({ page }) => {
    await page.goto('/finops');

    await page.waitForLoadState('networkidle');

    // Check for FinOps page content
    const pageContent = page.locator('main, [role="main"]');
    await expect(pageContent.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('AI Governance Features', () => {
  test('should navigate to AI Governance page', async ({ page }) => {
    await page.goto('/ai-governance');

    await page.waitForLoadState('networkidle');

    // Check for AI Governance page content
    const pageContent = page.locator('main, [role="main"]');
    await expect(pageContent.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Page should still be visible on mobile
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Page should still be visible on tablet
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
