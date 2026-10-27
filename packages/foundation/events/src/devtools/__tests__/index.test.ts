/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./devtools` entry: it exports `defineEventsDevtools` only, and the package
 *          depends on no Pro package and not on @stackra/devtools-kit (which depends on it).
 * Boundary: test only; imports the stand-in barrel through its `#devtools` alias and reads package.json from disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0246 (decision 4); ADR 0461 (no free package imports Pro).
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "@stackra/testing";

import * as devtools from "#devtools/index";

describe("@stackra/events/devtools", () => {
  it("exports exactly the events tabs", () => {
    expect(Object.keys(devtools)).toEqual(["defineEventsDevtools"]);
  });

  it("depends on no Pro package and not on the kit", () => {
    const manifest = readFileSync(new URL("../../../package.json", import.meta.url), "utf8");
    expect(manifest).not.toContain("@stackra-pro/");
    expect(manifest).not.toContain("@stackra/devtools-kit");
  });
});
