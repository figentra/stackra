/**
 * Stackra file contract:
 * Purpose: unit tests of `emitPackageEntries`: each entry holds its folders' exports and their shipped `X$` (one the
 *          member ships itself only from its own file), seeders
 *          go to `testing`, stand-in barrels are skipped, type-only names print as types, the generated module and
 *          each module's entity list go to `node`, no symbol appears in two entries, and a non-package writes no
 *          entry.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0305 (rule 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { emitPackageEntries } from "#core/functions/emit-package-entries.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

/** A hand-written OS shell entry directly in `src/`, exporting `register`. */
const shell = (file: string): (typeof LOYALTY_KIT_IR.files)[number] => ({
  file,
  importPath: `#src/${file.slice(4, file.lastIndexOf("."))}`,
  folder: "",
  names: [{ name: "register", typeOnly: false }],
});

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

  it("exports an X$ the member ships from its own file only, never from the schemas file too", () => {
    const shipped = emitPackageEntries({
      ...LOYALTY_KIT_IR,
      files: [
        ...LOYALTY_KIT_IR.files,
        {
          file: "src/core/constants/loyalty-kit-config-schema.constant.ts",
          importPath: "#core/constants/loyalty-kit-config-schema.constant",
          folder: "core",
          names: [{ name: "LoyaltyKitConfig$", typeOnly: false }],
        },
      ],
    });
    const index = shipped.find((file) => file.path === ".stackra/entry/index.ts")?.content ?? "";
    expect(index).toContain(
      'export { LoyaltyKitConfig$ } from "#core/constants/loyalty-kit-config-schema.constant";',
    );
    expect(index).toContain('export { LoyaltyKitOptions$ } from "#stackra/schemas/loyalty_kit";');
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

  it("exports each module's entity list from `node` for the host", () => {
    const withModel = {
      ...LOYALTY_KIT_IR,
      shapes: [
        ...LOYALTY_KIT_IR.shapes,
        {
          name: "LoyaltyAccount",
          kind: "model",
          module: "loyalty_kit",
          file: "src/node/models/loyalty-account.model.ts",
          importPath: "#node/models/loyalty-account.model",
          fields: [],
          relations: [],
          entity: { optional: [], relations: [], computed: [] },
        },
      ],
    };
    const node = emitPackageEntries(withModel).find(
      (file) => file.path === ".stackra/entry/node.ts",
    )?.content;
    expect(node).toContain('export { LOYALTY_KIT_ENTITIES } from "#stackra/entities/loyalty_kit";');
    expect(entry("node")).not.toContain("_ENTITIES");
  });

  it("puts no file directly in src/ in a barrel: those are hand-written shell entries", () => {
    const barrels = emitPackageEntries({
      ...LOYALTY_KIT_IR,
      files: [...LOYALTY_KIT_IR.files, shell("src/console.tsx"), shell("src/native.tsx")],
    });
    for (const barrel of barrels) expect(barrel.content, barrel.path).not.toContain("#src/");
    const index =
      barrels.find((barrel) => barrel.path === ".stackra/entry/index.ts")?.content ?? "";
    expect(index.match(/\bregister\b/g)).toBeNull();
    expect(index).toBe(entry("index"));
  });

  it("writes no entry for a service", () => {
    expect(emitPackageEntries(COMMERCE_IR)).toEqual([]);
  });
});
