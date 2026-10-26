/**
 * Stackra file contract:
 * Purpose: unit tests of `readPackageCatalogues` and `dependencyPath`: a declared `@stackra/*` package's `assets/lang`
 *          read through node_modules from the member root upward, a package without lang or outside `@stackra/`
 *          skipped, and an invalid catalogue refused with its path.
 * Boundary: test only; writes small fixtures under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0080; STA-1298.
 */
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { dependencyPath } from "#node/functions/dependency-path.function";
import { readPackageCatalogues } from "#node/functions/read-package-catalogues.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

describe("readPackageCatalogues", () => {
  it("reads each declared @stackra package's lang", () => {
    const root = writeFixtureMember("customers", {
      "node_modules/@stackra/loyalty-kit/package.json": JSON.stringify({
        name: "@stackra/loyalty-kit",
      }),
      "node_modules/@stackra/loyalty-kit/assets/lang/en/loyalty_kit.json": JSON.stringify({
        enums: { loyalty_tier: { gold: "Gold" } },
      }),
      "node_modules/@stackra/plain/package.json": JSON.stringify({ name: "@stackra/plain" }),
      "node_modules/@acme/kit/assets/lang/en/kit.json": JSON.stringify({ title: "Kit" }),
    });
    expect(
      readPackageCatalogues(root, ["@stackra/plain", "@acme/kit", "@stackra/loyalty-kit"]),
    ).toEqual([
      {
        package: "@stackra/loyalty-kit",
        catalogues: { en: { loyalty_kit: { enums: { loyalty_tier: { gold: "Gold" } } } } },
      },
    ]);
  });

  it("finds a package hoisted above the member", () => {
    const root = writeFixtureMember("nested", {
      "node_modules/@stackra/rules/assets/lang/en/rules.json": JSON.stringify({ title: "Rules" }),
    });
    const member = join(root, "services", "inner");
    expect(dependencyPath(member, "@stackra/rules", "assets/lang")).toBe(
      join(root, "node_modules", "@stackra", "rules", "assets", "lang"),
    );
    expect(readPackageCatalogues(member, ["@stackra/rules"])[0]?.package).toBe("@stackra/rules");
  });

  it("refuses an invalid catalogue", () => {
    const root = writeFixtureMember("broken-lang", {
      "node_modules/@stackra/rules/assets/lang/en/rules.json": "{ nope",
    });
    expect(() => readPackageCatalogues(root, ["@stackra/rules"])).toThrow(
      /rules\.json is not valid JSON/,
    );
  });
});
