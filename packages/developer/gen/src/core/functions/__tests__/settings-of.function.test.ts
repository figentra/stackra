/**
 * Stackra file contract:
 * Purpose: unit tests of `settingsOf`: the manifest entries (group key, class, module, file, keys with type, options
 *          and earlier paths, in group-key order, none without a settings class) and each refusal:
 *          `settings_unsupported_type`, `settings_too_deep`, `settings_scope_widened` (field, section and inner field,
 *          non-constant scopes skipped), `settings_group_key_empty` and `settings_group_conflict` (two own classes, an
 *          own class against a dependency, two dependencies, a host override exempt).
 * Boundary: test only; over a hand-built IR.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 22 and 23); ADR 0496 (decisions 7 and 9); STA-2056.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { settingsOf } from "#core/functions/settings-of.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FieldIR } from "#core/types/field-ir.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** A field. */
const field = (name: string, type: FieldIR["type"], extra: Partial<FieldIR> = {}): FieldIR => ({
  name,
  optional: false,
  nullable: false,
  type,
  rules: [],
  ...extra,
});

/** A settings shape of `module`. */
const settings = (
  name: string,
  fields: readonly FieldIR[],
  extra: Partial<ShapeIR> = {},
  module = "orders",
): ShapeIR => ({
  name,
  kind: "settings",
  module,
  file: `src/modules/${module}/${name}.ts`,
  importPath: `#modules/${module}/${name}`,
  fields,
  relations: [],
  ...extra,
});

/** A section shape. */
const section = (name: string, fields: readonly FieldIR[]): ShapeIR =>
  settings(name, fields, { kind: "schema" });

/** A declared class with its options and `@Setting` facets by field. */
const klass = (
  name: string,
  options: Record<string, unknown>,
  facets: Readonly<Record<string, unknown>> = {},
): DeclaredClass => ({
  name,
  kind: "settings",
  module: "orders",
  file: `src/modules/orders/${name}.ts`,
  importPath: `#modules/orders/${name}`,
  options,
  deps: [],
  facets: Object.entries(facets).map(([member, value]) => ({
    name: "Setting",
    kind: "setting",
    target: "field",
    member,
    options: value,
    from: "@stackra/settings",
  })),
  methods: [],
  refusals: [],
  statics: {},
  traits: [],
});

/** The member with `shapes`, `classes` and `dependencies`. */
const member = (
  shapes: readonly ShapeIR[],
  classes: readonly DeclaredClass[] = [],
  dependencies: MemberIR["dependencies"] = [],
): MemberIR => ({ ...COMMERCE_IR, shapes, classes, dependencies });

/** A dependency recording the group `key`. */
const dependency = (name: string, key: string): MemberIR["dependencies"][number] => ({
  package: name,
  manifest: {
    member: name,
    package: name,
    version: "1.0.0",
    settings: [{ key, class: "AccountSettings", module: "settings", file: "x.ts", keys: [] }],
  } as unknown as StackraManifest,
});

const codes = (ir: MemberIR): string[] =>
  settingsOf(ir).errors.map((error) => `${error.code} ${error.subject}`);

const MODE = { kind: "enum", name: "OrderMode", values: ["open", "closed"] } as const;

describe("settingsOf entries", () => {
  it("records each class's group key and its keys with type, options and earlier path", () => {
    const { entries, errors } = settingsOf(
      member([
        settings("OrdersSettings", [
          field("mode", MODE),
          field("tags", { kind: "array", element: { kind: "string" } }),
          field("note", { kind: "string" }, { renamed: "memo" }),
          field("cancellation", { kind: "schema", name: "CancellationSection", module: "orders" }),
        ]),
        section("CancellationSection", [
          field("windowDays", { kind: "number" }, { renamed: "days" }),
        ]),
      ]),
    );
    expect(errors).toEqual([]);
    expect(entries).toEqual([
      {
        key: "orders",
        class: "OrdersSettings",
        module: "orders",
        file: "src/modules/orders/OrdersSettings.ts",
        keys: [
          { path: "mode", type: "choice", options: ["open", "closed"] },
          { path: "tags", type: "list" },
          { path: "note", type: "string", renamed: ["memo"] },
          { path: "cancellation.windowDays", type: "number", renamed: ["cancellation.days"] },
        ],
      },
    ]);
  });

  it("orders groups by key and writes none for a member with no settings class", () => {
    const { entries } = settingsOf(
      member([
        settings("ZoneSettings", [field("a", { kind: "boolean" })]),
        settings("AccountSettings", [field("b", { kind: "boolean" })], {}, "settings"),
      ]),
    );
    expect(entries.map((entry) => entry["key"])).toEqual(["account", "zone"]);
    expect(settingsOf(COMMERCE_IR).entries).toEqual([]);
  });

  it("derives two keys for two classes of one module, with no conflict", () => {
    const ir = member([
      settings("OrdersSettings", [field("a", { kind: "boolean" })]),
      settings("OrdersPolicySettings", [field("b", { kind: "boolean" })]),
    ]);
    expect(settingsOf(ir).entries.map((entry) => entry["key"])).toEqual([
      "orders",
      "orders_policy",
    ]);
    expect(settingsOf(ir).errors).toEqual([]);
  });
});

describe("settingsOf refusals", () => {
  it("refuses a field no setting type holds instead of dropping it", () => {
    expect(
      codes(
        member([
          settings("OrdersSettings", [
            field("extras", { kind: "json" }),
            field("price", { kind: "money" }),
            field("owner", { kind: "public_id", prefix: "usr" }),
            field("counts", { kind: "array", element: { kind: "number" } }),
            field("ok", { kind: "boolean" }),
          ]),
        ]),
      ),
    ).toEqual([
      "settings_unsupported_type OrdersSettings.extras",
      "settings_unsupported_type OrdersSettings.price",
      "settings_unsupported_type OrdersSettings.owner",
      "settings_unsupported_type OrdersSettings.counts",
    ]);
  });

  it("names the file and the types it accepts", () => {
    const [error] = settingsOf(
      member([settings("OrdersSettings", [field("extras", { kind: "json" })])]),
    ).errors;
    expect(error?.file).toBe("src/modules/orders/OrdersSettings.ts");
    expect(error?.fix).toContain("enum");
  });

  it("refuses a section whose field is itself a schema, and a section it cannot read", () => {
    expect(
      codes(
        member([
          settings("OrdersSettings", [
            field("cancellation", {
              kind: "schema",
              name: "CancellationSection",
              module: "orders",
            }),
            field("other", { kind: "schema", name: "Missing", module: "orders" }),
          ]),
          section("CancellationSection", [
            field("nested", { kind: "schema", name: "CancellationSection", module: "orders" }),
          ]),
        ]),
      ),
    ).toEqual([
      "settings_too_deep CancellationSection.nested",
      "settings_unsupported_type OrdersSettings.other",
    ]);
  });

  it("refuses a class that derives an empty group key", () => {
    expect(codes(member([settings("Settings", [field("a", { kind: "boolean" })])]))).toEqual([
      "settings_group_key_empty Settings",
    ]);
  });

  it("refuses scopes that widen the class's, the section's or the field's enclosing scopes", () => {
    const shapes = [
      settings("OrdersSettings", [
        field("wide", { kind: "boolean" }),
        field("cancellation", { kind: "schema", name: "CancellationSection", module: "orders" }),
      ]),
      section("CancellationSection", [field("windowDays", { kind: "number" })]),
    ];
    const ok = klass(
      "OrdersSettings",
      { scopes: ["platform", "tenant"] },
      {
        wide: { scopes: ["platform"] },
        cancellation: { scopes: ["platform"] },
      },
    );
    expect(codes(member(shapes, [ok]))).toEqual([]);
    expect(
      codes(
        member(shapes, [
          klass(
            "OrdersSettings",
            { scopes: ["platform"] },
            { wide: { scopes: ["platform", "user"] } },
          ),
        ]),
      ),
    ).toEqual(["settings_scope_widened OrdersSettings.wide"]);
    expect(
      codes(
        member(shapes, [
          ok,
          {
            ...klass("CancellationSection", {}, { windowDays: { scopes: ["tenant"] } }),
            kind: "schema",
          },
        ]),
      ),
    ).toEqual(["settings_scope_widened CancellationSection.windowDays"]);
  });

  it("skips the scope check when scopes are not constants", () => {
    const shapes = [settings("OrdersSettings", [field("wide", { kind: "boolean" })])];
    expect(
      codes(
        member(shapes, [
          klass("OrdersSettings", { scopes: { $class: "X" } }, { wide: { scopes: ["user"] } }),
        ]),
      ),
    ).toEqual([]);
    expect(
      codes(
        member(shapes, [
          klass("OrdersSettings", { scopes: ["platform"] }, { wide: { scopes: {} } }),
        ]),
      ),
    ).toEqual([]);
  });
});

describe("settingsOf group conflicts", () => {
  it("refuses two own classes of one group, naming both files", () => {
    const ir = member([
      settings("OrdersSettings", [field("a", { kind: "boolean" })]),
      settings("OrdersSettings", [field("b", { kind: "boolean" })], {}, "billing"),
    ]);
    const [error] = settingsOf(ir).errors;
    expect(error?.code).toBe("settings_group_conflict");
    expect(error?.message).toContain("src/modules/billing/OrdersSettings.ts");
    expect(error?.message).toContain("src/modules/orders/OrdersSettings.ts");
  });

  it("refuses an own class against a dependency's group, but not a host override", () => {
    const own = settings("AccountSettings", [field("a", { kind: "boolean" })]);
    const dependencies = [dependency("@stackra/settings", "account")];
    expect(codes(member([own], [], dependencies))).toEqual(["settings_group_conflict account"]);
    const override = settings("AccountSettings", [field("a", { kind: "boolean" })], {
      base: { kind: "package", name: "AccountSettings", from: "@stackra/settings" },
    });
    expect(settingsOf(member([override], [], dependencies))).toEqual({ entries: [], errors: [] });
  });

  it("refuses two dependencies that record one group", () => {
    expect(
      codes(
        member(
          [],
          [],
          [dependency("@stackra/settings", "account"), dependency("@acme/identity", "account")],
        ),
      ),
    ).toEqual(["settings_group_conflict account"]);
    expect(codes(member([], [], [dependency("@stackra/settings", "account")]))).toEqual([]);
  });
});
