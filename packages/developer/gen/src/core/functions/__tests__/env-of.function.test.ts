/**
 * Stackra file contract:
 * Purpose: unit tests of `envOf` and the `env` section of `buildManifest`: a package's config rows (config, public and
 *          secret kinds, type, required, rules, refused prefixes, environments), no row for a host override, and a
 *          service's own and hosted rows with the `/runtime/<member>` home.
 * Boundary: test only; runs on hand-built package and service IRs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0173 (amendment 2026-11-04, decision 2); STA-2104.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { envOf } from "#core/functions/env-of.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FieldIR } from "#core/types/field-ir.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

/** A config class with `options`. */
function config(
  name: string,
  options: Record<string, unknown>,
  base?: DeclaredClass["base"],
): DeclaredClass {
  return {
    name,
    kind: "config",
    module: "pay",
    file: "src/config/pay.config.ts",
    importPath: "#config/pay.config",
    options,
    deps: [],
    facets: [],
    methods: [],
    refusals: [],
    statics: {},
    traits: [],
    ...(base === undefined ? {} : { base }),
  };
}

/** A string field. */
function field(name: string, extra: Partial<FieldIR> = {}): FieldIR {
  return { name, optional: false, nullable: false, type: { kind: "string" }, rules: [], ...extra };
}

const OPTIONS: ShapeIR = {
  name: "PayOptions",
  kind: "schema",
  module: "pay",
  file: "src/core/schemas/pay-options.schema.ts",
  importPath: "#core/schemas/pay-options.schema",
  fields: [
    field("apiOrigin", { type: { kind: "brand", brand: "url" } }),
    field("checkoutOrigin", {
      default: { kind: "literal", value: "https://pay.test" } as FieldIR["default"],
    }),
    field("stripeKey", {
      secret: {
        name: "STRIPE_SECRET_KEY",
        refuse: { staging: ["sk_live_"], production: ["sk_test_"] },
        environments: ["staging", "production"],
      },
      rules: [{ name: "Str", options: { min: 10 } }],
    }),
  ],
  relations: [],
} as unknown as ShapeIR;

const PAY_CONFIG = config("PayConfig", {
  schema: { $class: "PayOptions", from: "#core/schemas/pay-options.schema" },
  env: { apiOrigin: "STACKRA_PAY_API_ORIGIN", checkoutOrigin: "VITE_PAY_CHECKOUT_ORIGIN" },
});

/** A member IR. */
function member(
  layout: MemberIR["layout"],
  classes: readonly DeclaredClass[],
  shapes: readonly ShapeIR[] = [],
  dependencies: MemberIR["dependencies"] = [],
): MemberIR {
  return {
    member: layout === "package" ? "pay" : "checkout",
    package: layout === "package" ? "@stackra/pay" : "@figentra/service-checkout",
    version: "1.0.0",
    layout,
    modules: [],
    classes,
    shapes,
    enums: [],
    files: [],
    dependencies,
    errors: [],
  };
}

describe("envOf", () => {
  it("lists a package's config, public and secret names with their facts, sorted, without a home", () => {
    const rows = envOf(member("package", [PAY_CONFIG], [OPTIONS]));
    expect(rows.map((row) => [row["name"], row["kind"]])).toEqual([
      ["STACKRA_PAY_API_ORIGIN", "config"],
      ["STRIPE_SECRET_KEY", "secret"],
      ["VITE_PAY_CHECKOUT_ORIGIN", "public"],
    ]);
    expect(rows[0]).toMatchObject({
      type: "url",
      required: true,
      class: "PayConfig",
      field: "apiOrigin",
    });
    expect(rows[1]).toMatchObject({
      type: "string",
      rules: [{ name: "Str", options: { min: 10 } }],
      refuse: { staging: ["sk_live_"], production: ["sk_test_"] },
      environments: ["staging", "production"],
    });
    expect(rows[2]).toMatchObject({ required: false });
    expect(rows.some((row) => "home" in row)).toBe(false);
  });

  it("adds no row for a host override of a package config", () => {
    const override = config(
      "PayConfig",
      {},
      { kind: "package", name: "PayConfig", from: "@stackra/pay" },
    );
    expect(envOf(member("service", [override]))).toEqual([]);
  });

  it("gives a service its hosted packages' rows, marked from, and the runtime home", () => {
    const hosted: StackraManifest = {
      member: "pay",
      package: "@stackra/pay",
      version: "1.0.0",
      env: [
        {
          name: "STRIPE_SECRET_KEY",
          kind: "secret",
          config: "pay",
          class: "PayConfig",
          field: "stripeKey",
        },
      ],
    };
    const rows = envOf(member("service", [], [], [{ package: "@stackra/pay", manifest: hosted }]));
    expect(rows).toEqual([
      {
        name: "STRIPE_SECRET_KEY",
        kind: "secret",
        config: "pay",
        class: "PayConfig",
        field: "stripeKey",
        from: "@stackra/pay",
        home: "/runtime/checkout",
      },
    ]);
  });

  it("is the manifest's env section, absent when empty", () => {
    expect(buildManifest(member("package", [PAY_CONFIG], [OPTIONS])).manifest.env).toHaveLength(3);
    expect("env" in buildManifest(member("package", [])).manifest).toBe(false);
  });
});
