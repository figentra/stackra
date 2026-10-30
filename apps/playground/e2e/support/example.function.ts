/**
 * Stackra file contract:
 * Purpose: `example`, the section of one example on a component page (`components/component-page`): the first
 *          example of an entry is the page's Usage (`section#usage`), every other one is `section#example-<id>`.
 *          Scoping to it keeps a locator off the same demo drawn again, hidden and inert, in the Stackra section's
 *          direction and brand frames.
 * Boundary: test support only; it declares no test and is not matched by the Playwright config.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 4; ADR 0302 (decision 5); ADR 0022 (test placement).
 */
import type { Locator, Page } from "@playwright/test";

/** The section of the example `id` (its registry id; `"usage"` for the first one). */
export function example(page: Page, id: string): Locator {
  return page.locator(id === "usage" ? "section#usage" : `section#example-${id}`);
}
