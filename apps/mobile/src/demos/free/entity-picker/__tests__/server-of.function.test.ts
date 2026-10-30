/**
 * Stackra file contract:
 * Purpose: proves `serverOf` filters, pages, words the refused person and fails on demand.
 * Boundary: the function only; no React Native module loads.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";

import { serverOf } from "../server-of.function";

describe("serverOf", () => {
  it("pages the matches five at a time", async () => {
    const load = serverOf(0, { refused: "On leave" });
    const first = await load("");
    expect(first.items).toHaveLength(5);
    expect(first.nextCursor).toBe("5");
    const last = await load("", "10");
    expect(last.items).toHaveLength(2);
    expect(last.nextCursor).toBeNull();
  });

  it("filters by name and words the refused person", async () => {
    const page = await serverOf(0, { refused: "On leave" })("linus");
    expect(page.items).toEqual([
      expect.objectContaining({ id: "linus", description: "On leave", isDisabled: true }),
    ]);
  });

  it("fails with the given message", async () => {
    await expect(serverOf(0, { refused: "x", failure: "down" })("")).rejects.toThrow("down");
  });
});
