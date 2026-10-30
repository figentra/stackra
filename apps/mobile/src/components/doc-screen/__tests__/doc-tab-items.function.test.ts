/**
 * Stackra file contract:
 * Purpose: proves the component screen's pages are Preview · Usage · API · Docs, with Hooks after API only when the
 *          entry has hooks, each labelled through the translator.
 * Boundary: the pure function alone; no React.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 3.3; ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";

import { docTabItems } from "../doc-tab-items.function";

const t = (key: string) => key.split(".").at(-1) ?? key;

describe("docTabItems", () => {
  it("lists the four tabs in order", () => {
    expect(docTabItems(false, t).map((page) => page.id)).toEqual([
      "preview",
      "usage",
      "api",
      "docs",
    ]);
    expect(docTabItems(false, t).map((page) => page.label)).toEqual([
      "preview",
      "usage",
      "api",
      "docs",
    ]);
  });

  it("adds Hooks right after API when the entry has hooks", () => {
    expect(docTabItems(true, t).map((page) => page.id)).toEqual([
      "preview",
      "usage",
      "api",
      "hooks",
      "docs",
    ]);
  });
});
