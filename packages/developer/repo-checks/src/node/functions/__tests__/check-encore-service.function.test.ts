/**
 * Stackra file contract:
 * Purpose: unit tests of `checkEncoreService`, `catalogEncoreVersion` and `pathsOfImports`: a service passes with the
 *          catalog's literal `encore.dev` and tsconfig `paths` equal to its `imports`; `catalog:`, another version, a
 *          missing or stale block is a finding; `checkMember` leaves the service's `encore.dev` literal to this rule.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { catalogEncoreVersion } from "#node/functions/catalog-encore-version.function";
import { checkEncoreService } from "#node/functions/check-encore-service.function";
import { checkMember } from "#node/functions/check-member.function";
import { pathsOfImports } from "#node/functions/paths-of-imports.function";

const imports = { "#src/*": ["./src/*", "./src/*.ts"], "#stackra/*": "./.stackra/gen/*" };
const tsconfig = {
  compilerOptions: {
    baseUrl: ".",
    paths: { "#stackra/*": ["./.stackra/gen/*"], "#src/*": ["./src/*", "./src/*.ts"] },
  },
};
const pkg = { name: "@figentra/service-x", imports, dependencies: { "encore.dev": "1.58.8" } };

describe("checkEncoreService", () => {
  it("passes the catalog literal and paths equal to imports (a string target is one element)", () => {
    expect(pathsOfImports(imports)["#stackra/*"]).toEqual(["./.stackra/gen/*"]);
    expect(checkEncoreService({ pkg, tsconfig, catalogEncore: "1.58.8" })).toEqual([]);
  });

  it("refuses catalog:, another version and a stale paths block", () => {
    const catalogPin = { ...pkg, dependencies: { "encore.dev": "catalog:" } };
    expect(checkEncoreService({ pkg: catalogPin, tsconfig, catalogEncore: "1.58.8" })).toHaveLength(
      1,
    );
    expect(checkEncoreService({ pkg, tsconfig, catalogEncore: "1.59.0" })).toHaveLength(1);
    expect(checkEncoreService({ pkg, catalogEncore: "1.58.8" })).toHaveLength(1);
    const stale = { compilerOptions: { baseUrl: ".", paths: {} } };
    expect(checkEncoreService({ pkg, tsconfig: stale, catalogEncore: "1.58.8" })).toHaveLength(1);
  });

  it("reads the default catalog, and checkMember leaves a service's encore.dev to it", () => {
    expect(catalogEncoreVersion("catalog:\n  encore.dev: 1.58.8\n")).toBe("1.58.8");
    expect(catalogEncoreVersion("catalogs:\n  x:\n    encore.dev: 1.0.0\n")).toBeUndefined();
    // pnpm's other spelling of the default catalog, where fflow keeps its pin (INVOICING)
    expect(catalogEncoreVersion("catalogs:\n  default:\n    encore.dev: 1.58.8\n")).toBe("1.58.8");
    // the top-level form wins when a file has both
    expect(
      catalogEncoreVersion(
        "catalog:\n  encore.dev: 1.58.8\ncatalogs:\n  default:\n    encore.dev: 1.0.0\n",
      ),
    ).toBe("1.58.8");
    const member = {
      dir: "services/x",
      pkg: { name: "@figentra/service-x", dependencies: { "encore.dev": "1.58.8" } },
      turbo: { extends: ["//"], tags: ["tier:service"] },
      tsconfig: { extends: "@stackra/typescript-config/node" },
    };
    expect(checkMember(member)).toEqual([]);
    const app = { ...member, dir: "apps/x", turbo: { extends: ["//"], tags: ["tier:app"] } };
    expect(checkMember({ ...app, pkg: { ...member.pkg, name: "@figentra/x" } }).join()).toContain(
      "encore.dev",
    );
  });
});
