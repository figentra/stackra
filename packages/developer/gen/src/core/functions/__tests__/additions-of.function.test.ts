/**
 * Stackra file contract:
 * Purpose: unit tests of `additionsOf` and the side tables it feeds: an addition's manifest row (base key from the
 *          base's released manifest, side table, wire key, fields), the refusals `addition_base_source`,
 *          `addition_target_missing` and `addition_key_collision` (against another edition's manifest), the `additions`
 *          section of `buildManifest`, and the side-table `EntitySchema` `emitEntities` writes.
 * Boundary: test only; runs on a hand-built fashion edition IR over a released commerce manifest.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0336 (decisions 1, 2, 3 and 6, enforcement); ADR 0335
 *                     (decision 3).
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { additionsOf } from "#core/functions/additions-of.function";
import { buildManifest } from "#core/functions/build-manifest.function";
import { emitEntities } from "#core/functions/emit-entities.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

const FILE = "src/modules/fashion/models/product.model-addition.ts";

/** The released commerce manifest the edition builds against. */
const COMMERCE = {
  member: "commerce",
  package: "@figentra/commerce-client",
  version: "1.2.0",
  modules: [],
  models: [
    {
      key: "catalog.product",
      class: "Product",
      table: "catalog.products",
      publicId: "prd",
      traits: [],
    },
  ],
} as unknown as StackraManifest;

/** The addition class, with its partner (the base) overridable; `null` leaves the partner out. */
function addition(
  partner: NonNullable<DeclaredClass["partner"]> | null = {
    name: "Product",
    kind: "model",
    from: "@figentra/commerce-client",
  },
): DeclaredClass {
  return {
    name: "ProductAddition",
    kind: "model_addition",
    module: "fashion",
    file: FILE,
    importPath: "#modules/fashion/models/product.model-addition",
    options: {},
    ...(partner !== null ? { partner } : {}),
    deps: [],
    facets: [],
    methods: [],
    refusals: [],
    statics: {},
    traits: [],
  };
}

/** The fashion edition service with one addition. */
function edition(more: Partial<MemberIR> = {}, declared: DeclaredClass = addition()): MemberIR {
  return {
    member: "fashion",
    package: "@figentra/service-fashion",
    version: "1.0.0",
    layout: "service",
    modules: ["fashion"],
    classes: [declared],
    shapes: [
      {
        name: "ProductAddition",
        kind: "model_addition",
        module: "fashion",
        file: FILE,
        importPath: "#modules/fashion/models/product.model-addition",
        fields: [
          { name: "fit", optional: false, nullable: false, type: { kind: "string" }, rules: [] },
          { name: "season", optional: true, nullable: false, type: { kind: "string" }, rules: [] },
        ],
        relations: [],
      },
    ],
    enums: [],
    files: [],
    dependencies: [{ package: "@figentra/commerce-client", manifest: COMMERCE }],
    errors: [],
    ...more,
  };
}

describe("additionsOf", () => {
  it("lists an addition with its base, side table, wire key and fields", () => {
    expect(additionsOf(edition())).toEqual({
      additions: [
        {
          key: "fashion.product_addition",
          class: "ProductAddition",
          file: FILE,
          base: "catalog.product",
          from: "@figentra/commerce-client",
          table: "fashion.product_additions",
          wire: "fashion",
          fields: ["fit", "season"],
        },
      ],
      errors: [],
    });
  });

  it("refuses a base imported from source", () => {
    const { additions, errors } = additionsOf(
      edition(
        {},
        addition({ name: "Product", kind: "model", from: "#modules/catalog/models/product.model" }),
      ),
    );
    expect(additions).toEqual([]);
    expect(errors.map((error) => error.code)).toEqual(["addition_base_source"]);
  });

  it("refuses a base no released manifest declares", () => {
    const { errors } = additionsOf(
      edition({}, addition({ name: "Variant", kind: "model", from: "@figentra/commerce-client" })),
    );
    expect(errors.map((error) => error.code)).toEqual(["addition_target_missing"]);
    expect(additionsOf(edition({}, addition(null))).errors[0]?.code).toBe(
      "addition_target_missing",
    );
  });

  it("refuses a second addition on one base under one wire key", () => {
    const other = {
      member: "fashion_pack",
      package: "@figentra/fashion-pack",
      version: "1.0.0",
      modules: [],
      additions: [{ key: "fashion.product_addition", base: "catalog.product", wire: "fashion" }],
    } as unknown as StackraManifest;
    const { errors } = additionsOf(
      edition({
        dependencies: [
          { package: "@figentra/commerce-client", manifest: COMMERCE },
          { package: "@figentra/fashion-pack", manifest: other },
        ],
      }),
    );
    expect(errors.map((error) => error.code)).toEqual(["addition_key_collision"]);
  });
});

describe("model additions in the manifest and the entities", () => {
  it("writes the additions section", () => {
    const { manifest, errors } = buildManifest(edition());
    expect(errors).toEqual([]);
    expect(manifest["additions"]).toEqual(additionsOf(edition()).additions);
  });

  it("writes a side-table schema keyed by the base record's id", () => {
    const file = emitEntities(edition(), "fashion") ?? "";
    expect(file).toContain(
      "export const ProductAdditionSchema = new EntitySchema<ProductAddition & { id: string }>({",
    );
    expect(file).toContain('  name: "fashion.product_addition",');
    expect(file).toContain('  tableName: "product_additions",');
    expect(file).toContain('    id: { type: "string", primary: true },');
    expect(file).toContain('    season: { type: "string", nullable: true },');
    expect(file).toContain(
      "export const FASHION_ENTITIES: readonly EntitySchema[] = [ProductAdditionSchema];",
    );
  });
});
