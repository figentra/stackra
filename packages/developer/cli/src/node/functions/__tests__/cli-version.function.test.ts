/**
 * Stackra file contract:
 * Purpose: unit tests of `cliVersion`: it returns the version in this package's own package.json.
 * Boundary: test only; reads this package's package.json.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0177 (decision 5).
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "@stackra/testing";

import { cliVersion } from "#node/functions/cli-version.function";

describe("cliVersion", () => {
  it("is the version of @stackra/cli's package.json", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../../../../package.json", import.meta.url), "utf8"),
    ) as { name: string; version: string };
    expect(manifest.name).toBe("@stackra/cli");
    expect(cliVersion()).toBe(manifest.version);
  });
});
