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
import { INBOX_IR, PRODUCER_IR } from "#core/__tests__/fixtures/cross-app-ir.fixture";

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
      default: { value: "https://pay.test", code: '"https://pay.test"', imports: [] },
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
      { name: "PayConfig", from: "@stackra/pay", own: false },
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

  it("gives an app only its packages' public rows and a worker none", () => {
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
          field: "key",
        },
        {
          name: "VITE_PAY_ORIGIN",
          kind: "public",
          config: "pay",
          class: "PayConfig",
          field: "origin",
        },
      ],
    };
    const dependencies = [{ package: "@stackra/pay", manifest: hosted }];
    expect(envOf(member("app", [], [], dependencies)).map((row) => row["name"])).toEqual([
      "VITE_PAY_ORIGIN",
    ]);
    expect(envOf(member("worker", [], [], dependencies))).toEqual([]);
  });

  it("is the manifest's env section, absent when empty", () => {
    expect(buildManifest(member("package", [PAY_CONFIG], [OPTIONS])).manifest.env).toHaveLength(3);
    expect("env" in buildManifest(member("package", [])).manifest).toBe(false);
  });
});

describe("envOf and a producer's signing key (STA-1910)", () => {
  it("lists each signing key's secret name with the environments that name it", () => {
    const rows = envOf(PRODUCER_IR).filter((row) => row["config"] === "outbox.events_relay");
    expect(rows).toEqual([
      expect.objectContaining({
        name: "PAY_EVENTS_SIGNING_KEY",
        kind: "secret",
        environments: ["prod"],
      }),
      expect.objectContaining({
        name: "STACKRA_EVENTS_SIGNING_KEY",
        kind: "secret",
        environments: ["dev"],
      }),
    ]);
    expect(envOf(INBOX_IR).some((row) => row["config"] === "outbox.events_relay")).toBe(false);
  });
});
