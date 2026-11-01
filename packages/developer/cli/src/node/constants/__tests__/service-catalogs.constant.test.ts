/**
 * Stackra file contract:
 * Purpose: holds `SERVICE_CATALOGS` equal to this repository's `pnpm-workspace.yaml` (default, `build` and `quality`
 *          catalogs), so a version bump there fails here until the table the fresh-workspace scaffold ships follows it.
 * Boundary: test only; reads the root `pnpm-workspace.yaml`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); versions policy (catalogs); STA-1819.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";
import { parse } from "yaml";

import { SERVICE_CATALOGS } from "#node/constants/service-catalogs.constant";

const core = join(import.meta.dirname, "../../../../../../..");
const workspace = parse(readFileSync(join(core, "pnpm-workspace.yaml"), "utf8")) as {
  catalog: Record<string, string>;
  catalogs: Record<string, Record<string, string>>;
};

describe("SERVICE_CATALOGS", () => {
  it("matches the versions of pnpm-workspace.yaml", () => {
    for (const [name, entries] of Object.entries(SERVICE_CATALOGS)) {
      const source = name === "default" ? workspace.catalog : workspace.catalogs[name];
      for (const [dependency, version] of Object.entries(entries))
        expect(source?.[dependency], `${name}: ${dependency}`).toBe(version);
    }
  });
});
