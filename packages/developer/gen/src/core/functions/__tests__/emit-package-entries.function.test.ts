/**
 * Stackra file contract:
 * Purpose: unit tests of `emitPackageEntries`: each entry holds its folders' exports and their shipped `X$`, seeders
 *          go to `testing`, stand-in barrels are skipped, type-only names print as types, the generated module goes
 *          to `node`, no symbol appears in two entries, and a non-package writes no entry.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0305 (rule 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { emitPackageEntries } from "#core/functions/emit-package-entries.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

describe("emitPackageEntries", () => {
  const files = new Map(
    emitPackageEntries(LOYALTY_KIT_IR).map((file) => [file.path, file.content]),
  );
  const entry = (name: string): string => files.get(`.stackra/entry/${name}.ts`) ?? "";

  it("writes one barrel per entry with exports", () => {
    expect([...files.keys()].sort()).toEqual([
      ".stackra/entry/contracts.ts",
      ".stackra/entry/index.ts",
      ".stackra/entry/node.ts",
      ".stackra/entry/react.ts",
      ".stackra/entry/testing.ts",
    ]);
  });

  it("places config and core in `.`, with their schemas", () => {
    expect(entry("index")).toContain(
      'export { LoyaltyKitConfig } from "#config/loyalty-kit.config";',
    );
    expect(entry("index")).toContain(
      'export { LoyaltyService } from "#core/services/loyalty.service";',
    );
    expect(entry("index")).toContain(
      'export { LoyaltyKitConfig$, LoyaltyKitOptions$ } from "#stackra/schemas/loyalty_kit";',
    );
    expect(entry("index")).not.toContain("#core/index");
  });

  it("places contracts, node, react and testing", () => {
    expect(entry("contracts")).toContain(
      'export type { MemberId } from "#contracts/types/member-id.type";',
    );
    expect(entry("contracts")).toContain(
      'export { LoyaltyTier$ } from "#stackra/schemas/loyalty_kit";',
    );
    expect(entry("node")).toContain(
      'export { RedeemPointsAction } from "#node/actions/redeem-points.action";',
    );
    expect(entry("node")).toContain(
      'export { RedeemPointsAction$, RedeemPointsInput$ } from "#stackra/schemas/loyalty_kit";',
    );
    expect(entry("node")).toContain('export { LoyaltyKitModule } from "#stackra/module";');
    expect(entry("node")).not.toContain("demo.seeder");
    expect(entry("react")).toContain(
      'export type { PointsBalanceProps } from "#react/points-balance/points-balance.props";',
    );
    expect(entry("testing")).toContain(
      'export { LoyaltyKitDemoSeeder } from "#node/database/seeders/demo.seeder";',
    );
    expect(entry("testing")).toContain(
      'export { LoyaltyMembersFake } from "#testing/loyalty-members.fake";',
    );
  });

  it("exports no symbol from two entries", () => {
    const names = [...files.values()].flatMap((content) =>
      [...content.matchAll(/export (?:type )?\{ ([^}]+) \}/g)].flatMap((match) =>
        (match[1] ?? "").split(", ").map((name) => name.replace(/^type /, "")),
      ),
    );
    expect(new Set(names).size).toBe(names.length);
  });

  it("writes no entry for a service", () => {
    expect(emitPackageEntries(COMMERCE_IR)).toEqual([]);
  });
});
