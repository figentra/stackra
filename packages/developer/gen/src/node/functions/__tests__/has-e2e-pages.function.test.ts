/**
 * Stackra file contract:
 * Purpose: unit tests of `hasE2ePages`: true for a `.e2e.page.tsx` directly in a `__tests__/` folder at any depth
 *          under `src/`, false for a page outside `__tests__/`, a spec, a nested folder and a member with no `src/`.
 * Boundary: test only; writes a throwaway member in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement; package e2e).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { hasE2ePages } from "#node/functions/has-e2e-pages.function";

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

describe("hasE2ePages", () => {
  it("finds a page directly in a __tests__ folder at any depth under src", () => {
    touch("src/a/b/__tests__/button.e2e.page.tsx");
    expect(hasE2ePages(root)).toBe(true);
  });

  it("ignores the spec, a page outside __tests__, a nested folder and a member with no src", () => {
    expect(hasE2ePages(root)).toBe(false);
    touch("src/a/__tests__/button.e2e.test.ts");
    touch("src/a/button.e2e.page.tsx");
    touch("src/a/__tests__/deep/button.e2e.page.tsx");
    touch("src/a/__tests__/button.page.tsx");
    expect(hasE2ePages(root)).toBe(false);
  });
});
