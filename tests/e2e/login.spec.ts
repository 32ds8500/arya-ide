import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("displays login form", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Sign In");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("shows validation errors for empty fields", async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator("[data-testid='email-error']")).toBeVisible();
    await expect(page.locator("[data-testid='password-error']")).toBeVisible();
  });

  test("shows error for invalid email format", async ({ page }) => {
    await page.fill('input[type="email"]', "invalid-email");
    await page.click('button[type="submit"]');
    await expect(page.locator("[data-testid='email-error']")).toContainText("valid email");
  });

  test("shows error for wrong credentials", async ({ page }) => {
    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.locator("[data-testid='login-error']")).toBeVisible();
    await expect(page.locator("[data-testid='login-error']")).toContainText("Invalid");
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.fill('input[type="email"]', "admin@aryadev.io");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("[data-testid='user-menu']")).toBeVisible();
  });

  test("can toggle password visibility", async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute("type", "password");

    await page.click("[data-testid='toggle-password']");
    await expect(passwordInput).toHaveAttribute("type", "text");

    await page.click("[data-testid='toggle-password']");
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("navigates to register page", async ({ page }) => {
    await page.click("[data-testid='register-link']");
    await expect(page).toHaveURL(/\/register/);
  });

  test("handles keyboard navigation", async ({ page }) => {
    await page.fill('input[type="email"]', "admin@aryadev.io");
    await page.keyboard.press("Tab");
    await expect(page.locator('input[type="password"]')).toBeFocused();
  });
});
