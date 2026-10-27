/**
 * Stackra file contract:
 * Purpose: `visit`, which opens a page in a scheme and locale with reduced motion, so an overlay is settled when it is
 *          scanned.
 * Boundary: test support only; it declares no test and is not matched by the Playwright config.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
import { expect, type Page } from "@playwright/test";
import type { Scheme } from "./scheme.type";

/** Opens `path` in a scheme and locale (left to right, English, unless told otherwise) with reduced motion. */
export async function visit(
  page: Page,
  path: string,
  scheme: Scheme,
  locale: "en" | "ar" = "en",
): Promise<void> {
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
  await page.goto(`${path}?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}
