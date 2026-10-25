/**
 * Stackra file contract:
 * Purpose: unit tests of `normalizePath`: the key check every driver runs, which drops empty and `.` segments and a
 *          leading `/`, and refuses `..`, a backslash, a NUL and an empty key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0222 (key layout).
 */
import { describe, expect, it } from "@stackra/testing";

import { normalizePath } from "#core/functions/normalize-path.function";

describe("normalizePath", () => {
  it("keeps a canonical key as it is", () => {
    expect(normalizePath("t/ten_01/file_01/1")).toBe("t/ten_01/file_01/1");
  });

  it("drops a leading slash, empty and dot segments", () => {
    expect(normalizePath("/invoices//2026/./inv_01.pdf")).toBe("invoices/2026/inv_01.pdf");
    expect(normalizePath("a/b/")).toBe("a/b");
  });

  it.each(["", "/", ".", "../etc/passwd", "a/../../b", "a\\b", "a\0b"])("refuses %j", (path) => {
    expect(() => normalizePath(path)).toThrow(RangeError);
  });

  it("allows dots inside a segment", () => {
    expect(normalizePath("a/..b/c..")).toBe("a/..b/c..");
  });
});
