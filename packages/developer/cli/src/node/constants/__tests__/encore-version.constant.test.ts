/**
 * Stackra file contract:
 * Purpose: holds `ENCORE_VERSION` equal to this repository's root package.json `stackra.encore`, the version its
 *          reference services pin, so a bump there fails here until the default a new service pins follows it.
 * Boundary: test only; reads the root `package.json`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0091 (decision 2); STA-2794.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { ENCORE_VERSION } from "#node/constants/encore-version.constant";

const core = join(import.meta.dirname, "../../../../../../..");

describe("ENCORE_VERSION", () => {
  it("matches the root package.json stackra.encore", () => {
    const root = JSON.parse(readFileSync(join(core, "package.json"), "utf8")) as {
      stackra: { encore: string };
    };
    expect(ENCORE_VERSION).toBe(root.stackra.encore);
  });
});
