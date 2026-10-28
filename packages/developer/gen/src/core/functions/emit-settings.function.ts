/**
 * Stackra file contract:
 * Purpose: `emitSettings`, the settings target: `.stackra/gen/settings.ts`, reached as `#stackra/settings`, with
 *          `Settings`, the typed setting keys of the member's settings classes built by `settingKeys` of
 *          `@stackra/settings` (`Settings.orders.customersMayCancel`, and `Settings.pick([...])` for a form over keys).
 *          One key per setting field, a section's fields flattened under their section; each key carries its type,
 *          default, levels, label key, bounds, nullability, `@Setting` flags, section and earlier name.
 * Boundary: pure. Reads the settings shapes (kind `settings`), their section shapes, the class options (`scopes`) and
 *           the `@Setting` field facets; a field's `@Setting({ scopes })` narrows the class's, a section field's
 *           options apply to each key of the section unless its own field narrows them. The label is the declaring
 *           module's `<module>::settings.<section.>name.label` key. Nothing is written for a member with no settings
 *           class, or one that does not declare `@stackra/settings` (the import would not resolve).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 to 24); ADR 0294 (decisions 20 and 25); registry v3.1 section 5 (gen emits
 *                     `settings`); stackra-209 (STA-1364).
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import type { FieldIR } from "#core/types/field-ir.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

/** The `@Setting` options a key copies, in the order `SettingKeyInput` lists them. */
const FLAGS = [
  "lockable",
  "approval",
  "client",
  "live",
  "essential",
  "floor",
  "entitlement",
  "entitlementValues",
] as const;

/** The `SettingType` code of a field, or undefined for a type no setting holds. */
function settingType(field: FieldIR): string | undefined {
  const { type } = field;
  if (type.kind === "boolean") return "boolean";
  if (type.kind === "number")
    return field.rules.some((rule) => rule.name === "Int") ? "integer" : "number";
  if (type.kind === "public_id" && type.prefix === "conn") return "connection";
  if (type.kind === "string" || type.kind === "enum" || type.kind === "brand") return "string";
  return undefined;
}

/** The `min` and `max` of the field's `@Int`/`@Num` rule. */
function boundsOf(field: FieldIR): Record<string, unknown> {
  const options = field.rules.find((rule) => rule.name === "Int" || rule.name === "Num")?.options;
  return {
    ...(typeof options?.["min"] === "number" ? { min: options["min"] } : {}),
    ...(typeof options?.["max"] === "number" ? { max: options["max"] } : {}),
  };
}

/** The `@Setting` options of `className.member`, or undefined when it carries none. */
function settingOf(
  ir: MemberIR,
  owner: { readonly name: string; readonly module: string },
  member: string,
): Readonly<Record<string, unknown>> | undefined {
  const facet = ir.classes
    .find((declared) => declared.name === owner.name && declared.module === owner.module)
    ?.facets.find(
      (candidate) =>
        candidate.name === "Setting" && candidate.target === "field" && candidate.member === member,
    );
  if (facet === undefined) return undefined;
  return typeof facet.options === "object" && facet.options !== null
    ? (facet.options as Readonly<Record<string, unknown>>)
    : {};
}

/** The metadata of one key, as `settingKeys` takes it, with its label written as code. */
function keyOf(
  module: string,
  field: FieldIR,
  scopes: unknown,
  setting: Readonly<Record<string, unknown>>,
  section?: string,
): string | undefined {
  const type = settingType(field);
  // shortcut: a field of a type no SettingType names (json, array, record, money) gets no key; gen refuses none yet.
  if (type === undefined) return undefined;
  const inGroup = section === undefined ? field.name : `${section}.${field.name}`;
  const data: Record<string, unknown> = {
    type,
    default: field.default?.value ?? null,
    scopes: setting["scopes"] ?? scopes,
    ...boundsOf(field),
    ...(field.nullable ? { nullable: true } : {}),
    ...Object.fromEntries(
      FLAGS.filter((flag) => setting[flag] !== undefined).map((flag) => [flag, setting[flag]]),
    ),
    ...(section === undefined ? {} : { section }),
    ...(field.renamed === undefined
      ? {}
      : { renamed: [section === undefined ? field.renamed : `${section}.${field.renamed}`] }),
  };
  // A value gen could not read (scopes that are not constant) is left out, so the typecheck names it.
  const lines = Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `      ${JSON.stringify(name)}: ${JSON.stringify(value)},`);
  lines.push(`      "label": ${JSON.stringify(`${module}::settings.${inGroup}.label`)} as Label,`);
  return `    ${JSON.stringify(field.name)}: {\n${lines.join("\n")}\n    }`;
}

/** The keys of one settings class, a section's fields flattened under it, in declaration order. */
function keysOf(ir: MemberIR, shape: ShapeIR): string[] {
  const scopes = ir.classes.find(
    (declared) => declared.name === shape.name && declared.module === shape.module,
  )?.options["scopes"];
  const keys: (string | undefined)[] = [];
  for (const field of shape.fields) {
    const setting = settingOf(ir, shape, field.name) ?? {};
    if (field.type.kind !== "schema") {
      keys.push(keyOf(shape.module, field, scopes, setting));
      continue;
    }
    const { name, module } = field.type;
    const section = ir.shapes.find(
      (candidate) => candidate.name === name && candidate.module === module,
    );
    for (const inner of section?.fields ?? [])
      keys.push(
        keyOf(
          shape.module,
          inner,
          scopes,
          {
            ...setting,
            ...settingOf(ir, { name, module }, inner.name),
          },
          field.name,
        ),
      );
  }
  return keys.filter((key): key is string => key !== undefined);
}

/**
 * The `#stackra/settings` file of `ir`, or undefined when it has no settings class or does not declare
 * `@stackra/settings`.
 *
 * @param ir - the member read by discovery, with its settings shapes and their classes.
 * @example
 * emitSettings(ir); // 'export const Settings = settingKeys({\n  "orders": { ... } });'
 */
export function emitSettings(ir: MemberIR): string | undefined {
  if (ir.packages !== undefined && !ir.packages.includes("@stackra/settings")) return undefined;
  const groups = new Map<string, string[]>();
  for (const shape of ir.shapes.filter((candidate) => candidate.kind === "settings"))
    groups.set(shape.module, [...(groups.get(shape.module) ?? []), ...keysOf(ir, shape)]);
  const modules = [...groups]
    .filter(([, keys]) => keys.length > 0)
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort(([a], [b]) => a.localeCompare(b));
  if (modules.length === 0) return undefined;
  return [
    generatedHeader({
      from: "the settings classes (`extends Settings({ scopes })`), their sections and `@Setting` fields",
      purpose:
        `the typed setting keys of ${ir.package} (\`Settings.<module>.<name>\`, each with its full \`path\`) and ` +
        "`Settings.pick([...])`, a schema class over keys for a form that edits keys of several modules.",
      boundary:
        "reached as `#stackra/settings`; a key holds metadata only, values are read through `SettingsReader`. Change " +
        "a settings class and run `stackra gen`.",
      runtime: "isomorphic",
    }),
    'import { settingKeys, type SettingKeyInput } from "@stackra/settings";',
    "",
    "/** A label key, `<module>::settings.<path>.label`. */",
    'type Label = SettingKeyInput["label"];',
    "",
    "export const Settings = settingKeys({",
    ...modules.map(
      ([module, keys]) => `  ${JSON.stringify(module)}: {\n${keys.join(",\n")},\n  },`,
    ),
    "});",
    "",
  ].join("\n");
}
