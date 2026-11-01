/**
 * Stackra file contract:
 * Purpose: unit tests of `entitiesFile`: a package's entity list is the committed `src/node/entities.gen.ts`; a
 *          service's and an app's stay in the gitignored `.stackra/gen/entities/<module>.ts`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: STA-1874; ADR 0294 (R10, amended 2026-11-01); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { PACKAGE_ENTITIES_FILE } from "#core/constants/package-entities-file.constant";
import { entitiesFile } from "#core/functions/entities-file.function";
import type { MemberIR } from "#core/types/member-ir.type";

const of = (layout: MemberIR["layout"]): MemberIR => ({ layout }) as unknown as MemberIR;

describe("entitiesFile", () => {
  it("puts a package's list in its committed src/node/entities.gen.ts", () => {
    expect(entitiesFile(of("package"), "access_log")).toEqual({
      path: PACKAGE_ENTITIES_FILE,
      specifier: "#node/entities.gen",
    });
    expect(PACKAGE_ENTITIES_FILE).toBe("src/node/entities.gen.ts");
  });

  it("keeps a service's and an app's list in the gitignored .stackra/gen/entities", () => {
    for (const layout of ["service", "app"] as const)
      expect(entitiesFile(of(layout), "shop")).toEqual({
        path: ".stackra/gen/entities/shop.ts",
        specifier: "#stackra/entities/shop",
      });
  });
});
