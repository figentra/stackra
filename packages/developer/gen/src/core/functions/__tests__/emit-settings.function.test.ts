/**
 * Stackra file contract:
 * Purpose: unit tests of `emitSettings` (stackra-209): `#stackra/settings` with one `settingKeys` entry per setting
 *          field of each settings class, a section's fields flattened under their section; each key's type (an `@Int`
 *          number is `integer`, a `conn` id is `connection`), default, the class's scopes or a field's narrower ones,
 *          bounds, nullability, `@Setting` flags, earlier name and label key; a field of a type no setting holds left
 *          out; nothing for a member with no settings class or without `@stackra/settings`; and `generateMember`
 *          writing `.stackra/gen/settings.ts`.
 * Boundary: test only; asserts on the generated source text over a hand-built IR.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 22 to 24); stackra-209 (STA-1364).
 */
import { describe, expect, it } from "@stackra/testing";

import { emitSettings } from "#core/functions/emit-settings.function";
import { generateMember } from "#core/functions/generate-member.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FieldIR } from "#core/types/field-ir.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** A field with no rules. */
const field = (name: string, type: FieldIR["type"], extra: Partial<FieldIR> = {}): FieldIR => ({
  name,
  optional: false,
  nullable: false,
  type,
  rules: [],
  ...extra,
});

/** Each class's file under the orders module, named as its kind's file. */
const FILES: Readonly<Record<string, string>> = {
  OrdersSettings: "orders.settings",
  CancellationSection: "schemas/cancellation-section.schema",
};

/** A shape of the orders module. */
const shape = (name: string, kind: string, fields: readonly FieldIR[]): ShapeIR => ({
  name,
  kind,
  module: "orders",
  file: `src/modules/orders/${FILES[name] ?? name}.ts`,
  importPath: `#modules/orders/${FILES[name] ?? name}`,
  fields,
  relations: [],
});

/** A declared class of the orders module with its options and facets. */
const declared = (
  name: string,
  kind: string,
  options: Readonly<Record<string, unknown>>,
  facets: DeclaredClass["facets"],
): DeclaredClass => ({
  name,
  kind,
  module: "orders",
  file: `src/modules/orders/${FILES[name] ?? name}.ts`,
  importPath: `#modules/orders/${FILES[name] ?? name}`,
  options,
  deps: [],
  facets,
  methods: [],
  refusals: [],
  statics: {},
  traits: [],
});

/** A `@Setting` facet on `member`. */
const setting = (member: string, options: unknown): DeclaredClass["facets"][number] => ({
  name: "Setting",
  kind: "setting",
  target: "field",
  member,
  options,
  from: "@stackra/settings",
});

const SETTINGS = shape("OrdersSettings", "settings", [
  field(
    "customersMayCancel",
    { kind: "boolean" },
    { default: { value: true, code: "true", imports: [] } },
  ),
  field(
    "maxOpenOrders",
    { kind: "number" },
    {
      rules: [{ name: "Int", options: { min: 1, max: 50 } }],
      default: { value: 5, code: "5", imports: [] },
    },
  ),
  field("payoutConnection", { kind: "public_id", prefix: "conn" }, { nullable: true }),
  field(
    "note",
    { kind: "string" },
    { renamed: "memo", default: { value: "", code: '""', imports: [] } },
  ),
  field("mode", { kind: "enum", name: "OrderMode", values: ["open", "closed"] }),
  field("tags", { kind: "array", element: { kind: "string" } }),
  field("modes", {
    kind: "array",
    element: { kind: "enum", name: "OrderMode", values: ["open", "closed"] },
  }),
  field("cancellation", { kind: "schema", name: "CancellationSection", module: "orders" }),
]);

const SECTION = shape("CancellationSection", "schema", [
  field(
    "windowDays",
    { kind: "number" },
    {
      rules: [{ name: "Num", options: { min: 0 } }],
      default: { value: 14, code: "14", imports: [] },
    },
  ),
]);

const IR: MemberIR = {
  ...COMMERCE_IR,
  shapes: [...COMMERCE_IR.shapes, SETTINGS, SECTION],
  classes: [
    ...COMMERCE_IR.classes,
    declared("OrdersSettings", "settings", { scopes: ["platform", "product", "node"] }, [
      setting("customersMayCancel", { client: true, essential: true }),
      setting("maxOpenOrders", { scopes: ["platform"], approval: true }),
      setting("cancellation", { lockable: true }),
    ]),
    declared("CancellationSection", "schema", {}, [
      setting("windowDays", { floor: "consumer.withdrawal_days" }),
    ]),
  ],
};

describe("emitSettings", () => {
  const content = emitSettings(IR) ?? "";

  it("builds the keys through settingKeys of @stackra/settings", () => {
    expect(content).toContain(
      'import { settingKeys, type SettingKeyInput } from "@stackra/settings";',
    );
    expect(content).toContain('type Label = SettingKeyInput["label"];');
    expect(content).toContain(
      'export const Settings = settingKeys({\n  "orders": {\n    "customersMayCancel": {',
    );
  });

  it("writes a key's type, default, class scopes, @Setting flags and label", () => {
    expect(content).toContain(
      [
        '    "customersMayCancel": {',
        '      "type": "boolean",',
        '      "default": true,',
        '      "scopes": ["platform","product","node"],',
        '      "client": true,',
        '      "essential": true,',
        '      "label": "orders::settings.customersMayCancel.label" as Label,',
        "    }",
      ].join("\n"),
    );
  });

  it("types an @Int number as integer with its bounds, and narrows the scopes by @Setting", () => {
    expect(content).toContain(
      [
        '    "maxOpenOrders": {',
        '      "type": "integer",',
        '      "default": 5,',
        '      "scopes": ["platform"],',
        '      "min": 1,',
        '      "max": 50,',
        '      "approval": true,',
      ].join("\n"),
    );
  });

  it("types a conn id as a nullable connection with a null default, and records an earlier name", () => {
    expect(content).toContain(
      '"payoutConnection": {\n      "type": "connection",\n      "default": null,',
    );
    expect(content).toContain('      "nullable": true,');
    expect(content).toContain('      "renamed": ["memo"],');
  });

  it("flattens a section's fields under the section, with the section field's flags and its own", () => {
    expect(content).toContain(
      [
        '    "windowDays": {',
        '      "type": "number",',
        '      "default": 14,',
        '      "scopes": ["platform","product","node"],',
        '      "min": 0,',
        '      "lockable": true,',
        '      "floor": "consumer.withdrawal_days",',
        '      "section": "cancellation",',
        '      "label": "orders::settings.cancellation.windowDays.label" as Label,',
      ].join("\n"),
    );
    expect(content).not.toContain('"cancellation": {');
  });

  it("writes an enum as a choice and a string array as a list, with options where the enum gives them", () => {
    expect(content).toContain(
      '    "mode": {\n      "type": "choice",\n      "default": null,\n      "scopes": ["platform","product","node"],\n      "options": ["open","closed"],',
    );
    expect(content).toContain('    "tags": {\n      "type": "list",');
    expect(content).toContain('    "modes": {\n      "type": "list",');
    expect(content.match(/"options": \["open","closed"\]/g)).toHaveLength(2);
  });

  it("writes no key for a field no setting holds; settingsOf refuses it in the manifest pass", () => {
    const json = {
      ...IR,
      shapes: IR.shapes.map((candidate) =>
        candidate === SETTINGS
          ? { ...candidate, fields: [...candidate.fields, field("extras", { kind: "json" })] }
          : candidate,
      ),
    };
    expect(emitSettings(json)).not.toContain('"extras"');
    expect(generateMember(json).errors.map((error) => error.code)).toContain(
      "settings_unsupported_type",
    );
  });

  it("groups by the key the class name derives, and labels a group other than the module's with it", () => {
    const account: MemberIR = {
      ...COMMERCE_IR,
      shapes: [
        {
          ...shape("AccountSettings", "settings", [field("locale", { kind: "string" })]),
          module: "settings",
        },
      ],
      classes: [
        {
          ...declared("AccountSettings", "settings", { scopes: ["user"] }, []),
          module: "settings",
        },
      ],
    };
    const text = emitSettings(account) ?? "";
    expect(text).toContain('  "account": {\n    "locale": {');
    expect(text).not.toContain('"settings": {');
    expect(text).toContain('"label": "settings::settings.account.locale.label" as Label,');
  });

  it("writes nothing without a settings class or without @stackra/settings", () => {
    expect(emitSettings(COMMERCE_IR)).toBeUndefined();
    expect(emitSettings({ ...IR, packages: ["@stackra/validation"] })).toBeUndefined();
  });

  it("is written by generateMember as .stackra/gen/settings.ts", () => {
    const { files, errors } = generateMember(IR);
    expect(errors).toEqual([]);
    expect(files.find((file) => file.path === ".stackra/gen/settings.ts")?.content).toBe(content);
  });
});
