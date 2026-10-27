/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./devtools` entry: it exports `defineContainerDevtools` and the
 *          `DevtoolsTabSink` types, nothing else, and the package depends on no Pro package and not on
 *          @stackra/devtools-kit (which depends on it).
 * Boundary: test only; imports the stand-in barrel through its `#devtools` alias and reads package.json from disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0246 (decision 4); ADR 0461 (no free package imports Pro).
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "@stackra/testing";

import * as devtools from "#devtools/index";
import type { DevtoolsTabSink, DevtoolsTabSinkDefinition } from "#devtools/index";

/** Every type the entry exports; this alias fails to compile if one stops resolving. */
type EntryTypes = [DevtoolsTabSink, DevtoolsTabSinkDefinition];

describe("@stackra/container/devtools", () => {
  it("exports exactly the container tab", () => {
    expect(Object.keys(devtools).sort()).toEqual(["defineContainerDevtools"]);
  });

  it("exports the sink types", () => {
    const types: EntryTypes | undefined = undefined;
    expect(types).toBeUndefined();
  });

  it("depends on no Pro package and not on the kit", () => {
    const manifest = readFileSync(new URL("../../../package.json", import.meta.url), "utf8");
    expect(manifest).not.toContain("@stackra-pro/");
    expect(manifest).not.toContain("@stackra/devtools-kit");
  });
});
