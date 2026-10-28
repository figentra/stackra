/**
 * Stackra file contract:
 * Purpose: unit tests of `emitMemberModule`: the generated `<Key>Module`, bare without module-shipping dependencies
 *          and importing each one's module from its `node` entry otherwise, and nothing when a root module is
 *          authored.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rules 15 and 16).
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import { emitMemberModule } from "#core/functions/emit-member-module.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** A dependency's manifest that ships a module. */
const LOYALTY_KIT: StackraManifest = {
  member: "loyalty_kit",
  package: "@acme/loyalty-kit",
  version: "0.4.0",
  modules: [
    {
      key: "loyalty_kit",
      class: "LoyaltyKitModule",
      file: "src/node/loyalty-kit.module.ts",
      exports: [],
      dependsOn: [],
    },
  ],
};

describe("emitMemberModule", () => {
  it("writes a bare module without dependencies", () => {
    const content = emitMemberModule(COMMERCE_IR) ?? "";
    expect(content).toContain(GENERATED_NOTICE);
    expect(content).toContain('import { Module } from "@stackra/container";');
    expect(content).toContain("export class CommerceModule extends Module {}");
  });

  it("imports each dependency's module", () => {
    const content =
      emitMemberModule({
        ...COMMERCE_IR,
        dependencies: [
          { package: "@acme/loyalty-kit", manifest: LOYALTY_KIT },
          {
            package: "@stackra/contracts",
            manifest: { member: "contracts", package: "@stackra/contracts", version: "0.0.0" },
          },
        ],
      }) ?? "";
    expect(content).toContain('import { LoyaltyKitModule } from "@acme/loyalty-kit/node";');
    expect(content).toContain(
      "export class CommerceModule extends Module({ imports: [LoyaltyKitModule] }) {}",
    );
  });

  it("skips a dependency whose module is generated (no file, exported by no entry)", () => {
    const generated: StackraManifest = {
      ...LOYALTY_KIT,
      modules: [{ key: "loyalty_kit", class: "LoyaltyKitModule", exports: [], dependsOn: [] }],
    };
    const content =
      emitMemberModule({
        ...COMMERCE_IR,
        dependencies: [{ package: "@acme/loyalty-kit", manifest: generated }],
      }) ?? "";
    expect(content).not.toContain("LoyaltyKitModule");
    expect(content).toContain("export class CommerceModule extends Module {}");
  });

  it("writes nothing when the root module is authored", () => {
    expect(
      emitMemberModule({
        ...COMMERCE_IR,
        rootModule: { name: "CommerceModule", from: "#src/commerce.module" },
      }),
    ).toBeUndefined();
  });
});
