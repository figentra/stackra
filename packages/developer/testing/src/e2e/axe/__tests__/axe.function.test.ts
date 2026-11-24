/**
 * Stackra file contract:
 * Purpose: unit tests of `axe`: axe-core runs on the page restricted to the WCAG 2.0, 2.1 and 2.2 A and AA rule sets, and its report is
 *          returned as it is.
 * Boundary: test only; `@axe-core/playwright`'s `AxeBuilder` is replaced by a recording stub.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";
import type { Page } from "@playwright/test";
import { vi } from "vitest";

import { axe } from "#e2e/axe/axe.function";

const { builders } = vi.hoisted(() => ({
  builders: [] as { page: unknown; tags: string[] }[],
}));
vi.mock("@axe-core/playwright", () => ({
  AxeBuilder: class {
    readonly record: { page: unknown; tags: string[] };

    constructor(options: { page: unknown }) {
      this.record = { page: options.page, tags: [] };
      builders.push(this.record);
    }

    withTags(tags: string[]) {
      this.record.tags = tags;
      return this;
    }

    async analyze() {
      return { violations: [{ id: "color-contrast" }] };
    }
  },
}));

describe("axe", () => {
  it("analyzes the page against the WCAG A and AA rule sets and returns the report", async () => {
    const page = {} as Page;
    const report = await axe(page);
    expect(builders[0]?.page).toBe(page);
    expect(builders[0]?.tags).toEqual(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
    expect(report).toEqual({ violations: [{ id: "color-contrast" }] });
  });
});
