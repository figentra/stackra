/**
 * Stackra file contract:
 * Purpose: unit tests of `hasIntTests`: true for an `.int.test.ts(x)` in a `__tests__/` folder at any depth under
 *          `src/` or one gen writes under `.stackra/tests/`, false for unit tests, an int-named file outside
 *          `__tests__/`, and a member with no `src/`.
 * Boundary: test only; writes a throwaway member in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182; STA-1819.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { hasIntTests } from "#node/functions/has-int-tests.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-gen-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const touch = (path: string): void => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), "");
};

describe("hasIntTests", () => {
  it("finds an int test at any depth under __tests__", () => {
    touch("src/a/__tests__/x.int.test.ts");
    expect(hasIntTests(root)).toBe(true);
    touch("src/b/c/__tests__/y.int.test.tsx");
    expect(hasIntTests(root)).toBe(true);
  });

  it("counts an int test gen writes under .stackra/tests, with no src at all", () => {
    expect(hasIntTests(root, [".stackra/tests/tenant-isolation.int.test.ts"])).toBe(true);
    expect(hasIntTests(root, [".stackra/tests/migrations/x.int.test.ts"])).toBe(true);
    expect(
      hasIntTests(root, [
        ".stackra/tests/migrations.test.ts",
        ".stackra/gen/x.int.test.ts",
        "tests/x.int.test.ts",
      ]),
    ).toBe(false);
  });

  it("ignores unit tests, int-named files outside __tests__ and a member with no src", () => {
    expect(hasIntTests(root)).toBe(false);
    touch("src/a/__tests__/x.test.ts");
    touch("src/a/x.int.test.ts");
    expect(hasIntTests(root)).toBe(false);
  });
});
