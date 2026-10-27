/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./devtools` entry: it exports `defineActionsDevtools` only, and the package
 *          depends on no Pro package.
 * Boundary: test only; imports the stand-in barrel through its `#devtools` alias and reads package.json from disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0246 (decision 4); ADR 0461 (no free package imports Pro).
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "@stackra/testing";

import * as devtools from "#devtools/index";

describe("@stackra/actions/devtools", () => {
  it("exports exactly the actions tab", () => {
    expect(Object.keys(devtools)).toEqual(["defineActionsDevtools"]);
  });

  it("depends on no Pro package", () => {
    const manifest = readFileSync(new URL("../../../package.json", import.meta.url), "utf8");
    expect(manifest).not.toContain("@stackra-pro/");
  });
});
