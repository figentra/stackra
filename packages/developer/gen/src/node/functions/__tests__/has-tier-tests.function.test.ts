/**
 * Stackra file contract:
 * Purpose: unit tests of `hasTierTests`: for each infixed tier, true for an `.<tier>.test.ts(x)` in a `__tests__/`
 *          folder at any depth under `src/` or one gen writes under `.stackra/tests/`, false for unit tests, a file of
 *          the other tier, a tier-named file outside `__tests__/`, and a member with no `src/`.
 * Boundary: test only; writes a throwaway member in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182; STA-1819; STA-2837.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { hasTierTests } from "#node/functions/has-tier-tests.function";

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

describe("hasTierTests", () => {
  it("finds an int test at any depth under __tests__", () => {
    touch("src/a/__tests__/x.int.test.ts");
    expect(hasTierTests(root, "int")).toBe(true);
    touch("src/b/c/__tests__/y.int.test.tsx");
    expect(hasTierTests(root, "int")).toBe(true);
  });

  it("counts an int test gen writes under .stackra/tests, with no src at all", () => {
    expect(hasTierTests(root, "int", [".stackra/tests/tenant-isolation.int.test.ts"])).toBe(true);
    expect(hasTierTests(root, "int", [".stackra/tests/migrations/x.int.test.ts"])).toBe(true);
    expect(
      hasTierTests(root, "int", [
        ".stackra/tests/migrations.test.ts",
        ".stackra/gen/x.int.test.ts",
        "tests/x.int.test.ts",
      ]),
    ).toBe(false);
  });

  it("ignores unit tests, int-named files outside __tests__ and a member with no src", () => {
    expect(hasTierTests(root, "int")).toBe(false);
    touch("src/a/__tests__/x.test.ts");
    touch("src/a/x.int.test.ts");
    expect(hasTierTests(root, "int")).toBe(false);
  });

  it("finds a contract test under __tests__ or under .stackra/tests, and only for the contract tier", () => {
    expect(hasTierTests(root, "contract")).toBe(false);
    expect(hasTierTests(root, "contract", [".stackra/tests/openapi.contract.test.ts"])).toBe(true);
    expect(hasTierTests(root, "contract", [".stackra/tests/tenant-isolation.int.test.ts"])).toBe(
      false,
    );
    touch("src/a/__tests__/x.int.test.ts");
    touch("src/a/x.contract.test.ts");
    expect(hasTierTests(root, "contract")).toBe(false);
    touch("src/a/__tests__/http.contract.test.ts");
    expect(hasTierTests(root, "contract")).toBe(true);
    rmSync(join(root, "src/a/__tests__/x.int.test.ts"));
    expect(hasTierTests(root, "int")).toBe(false);
  });
});
