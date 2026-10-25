/**
 * Stackra file contract:
 * Purpose: unit tests of `findSeedPack`: the nearest `seed-packs/<product>` above the working folder, and the
 *          refusals of a missing pack and a product key that is not kebab-case.
 * Boundary: test only; writes a throwaway repository in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); config-model section 6.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { findSeedPack } from "#node/functions/find-seed-pack.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("findSeedPack", () => {
  it("finds the pack above a service folder", () => {
    mkdirSync(join(root, "seed-packs/commerce"), { recursive: true });
    writeFileSync(join(root, "seed-packs/commerce/seed-pack.yaml"), "");
    mkdirSync(join(root, "services/commerce"), { recursive: true });
    expect(findSeedPack(join(root, "services/commerce"), "commerce")).toBe(
      join(root, "seed-packs/commerce"),
    );
  });

  it("refuses a missing pack and a bad key", () => {
    expect(() => findSeedPack(root, "commerce")).toThrow(CliUsageError);
    expect(() => findSeedPack(root, "Commerce")).toThrow(CliUsageError);
  });
});
