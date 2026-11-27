/**
 * Stackra file contract:
 * Purpose: unit tests of `hasLoadTests`: true for a `.load.test.ts(x)` in a `__tests__/` folder at any depth under
 *          `src/`, false for unit and int tests, a load-named file outside `__tests__/` and a member with no `src/`.
 * Boundary: test only; writes a throwaway member in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182; STA-317.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { hasLoadTests } from "#node/functions/has-load-tests.function";

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

describe("hasLoadTests", () => {
  it("finds a load test at any depth under __tests__", () => {
    touch("src/a/__tests__/x.load.test.ts");
    expect(hasLoadTests(root)).toBe(true);
    touch("src/b/c/__tests__/y.load.test.tsx");
    expect(hasLoadTests(root)).toBe(true);
  });

  it("ignores unit and int tests, load-named files outside __tests__ and a member with no src", () => {
    expect(hasLoadTests(root)).toBe(false);
    touch("src/a/__tests__/x.test.ts");
    touch("src/a/__tests__/x.int.test.ts");
    touch("src/a/x.load.test.ts");
    expect(hasLoadTests(root)).toBe(false);
  });
});
