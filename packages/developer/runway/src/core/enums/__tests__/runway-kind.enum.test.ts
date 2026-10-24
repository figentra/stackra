/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayKind`: the three runway kinds in order, each the name of a committed JSON Schema file.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decisions 1 and 2).
 */
import { existsSync } from "node:fs";

import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { RunwayKind } from "#core/enums/runway-kind.enum";

describe("RunwayKind", () => {
  it("lists root, app and service", () => {
    expect(Enum.values(RunwayKind)).toEqual(["root", "app", "service"]);
    expectTypeOf<RunwayKind>().toEqualTypeOf<"root" | "app" | "service">();
  });

  it("names a committed schema file per kind", () => {
    for (const kind of Enum.values(RunwayKind)) {
      expect(existsSync(new URL(`../../../../schema/${kind}.json`, import.meta.url))).toBe(true);
    }
  });
});
