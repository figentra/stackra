/**
 * Stackra file contract:
 * Purpose: `settingsOf`, the member's settings groups for the manifest's `settings` section (one entry per own settings
 *          class: group key, class, module, file and keys with their path, type, options and earlier paths) and the
 *          refusals found on the way: `settings_unsupported_type` (a field no `SettingType` holds), `settings_too_deep`
 *          (a section's field that is itself a schema), `settings_scope_widened` (a `@Setting({ scopes })` outside its
 *          enclosing scopes), `settings_group_key_empty` (a class named only `Settings`) and `settings_group_conflict`
 *          (two classes, or a class and a dependency's recorded group, that derive one group key).
 * Boundary: pure. A host override (a shape whose base is a package's) keeps its base's key and is neither a conflict
 *           nor an entry: the base package locks it. Scopes that gen cannot read as constants skip the scope check.
 *           Entries come in group-key order, and none for a member with no settings class of its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 and 23); ADR 0294 (decisions 5, 20 and 22); ADR 0496 (decisions 7 and 9);
 *                     ADR 0306 (overrides keep the name); STA-2056.
 */
import type { Json } from "@stackra/contracts";

import { earlierPathsOf } from "#core/functions/earlier-paths-of.function";
import { settingFacetOf } from "#core/functions/setting-facet-of.function";
import { settingTypeOf } from "#core/functions/setting-type-of.function";
import { settingsKeyOf } from "#core/functions/settings-key-of.function";
import type { FieldIR } from "#core/types/field-ir.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

/** One settings group of the manifest's `settings` section. */
type SettingsEntry = { [key: string]: Json };

/** The scopes as strings, or undefined when they are absent or not constant. */
function scopesOf(value: unknown): readonly string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? (value as readonly string[])
    : undefined;
}

/**
 * The settings groups of `ir` and their refusals.
 *
 * @param ir - the member read by discovery, with its settings shapes, their classes and its dependencies' manifests.
 * @example
 * const { entries, errors } = settingsOf(ir);
 * entries[0]?.["key"]; // "orders"
 */
export function settingsOf(ir: MemberIR): {
  readonly entries: readonly SettingsEntry[];
  readonly errors: readonly GenError[];
} {
  const errors: GenError[] = [];
  const refuse = (
    file: string,
    code: string,
    subject: string,
    message: string,
    fix: string,
  ): void => {
    errors.push({ code, file, line: 0, column: 0, subject, message, fix });
  };
  const entries: SettingsEntry[] = [];
  const owners = new Map<string, ShapeIR>();

  for (const shape of ir.shapes.filter((candidate) => candidate.kind === "settings")) {
    const key = settingsKeyOf(shape);
    if (key === "") {
      refuse(
        shape.file,
        "settings_group_key_empty",
        shape.name,
        `${shape.name} derives an empty group key, and the settings runtime refuses a class with none`,
        `name the class <Group>Settings, such as OrdersSettings`,
      );
      continue;
    }
    const classScopes = scopesOf(
      ir.classes.find(
        (declared) => declared.name === shape.name && declared.module === shape.module,
      )?.options["scopes"],
    );
    const keys: SettingsEntry[] = [];
    /** Refuses `scopes` that widen `enclosing`. */
    const checkScopes = (
      subject: string,
      scopes: unknown,
      enclosing: readonly string[] | undefined,
    ) => {
      const narrowed = scopesOf(scopes);
      const widened = narrowed?.filter((scope) => !(enclosing?.includes(scope) ?? true)) ?? [];
      if (widened.length > 0)
        refuse(
          shape.file,
          "settings_scope_widened",
          subject,
          `${subject} lists ${widened.join(", ")}, which its enclosing scopes (${(enclosing ?? []).join(", ")}) do not allow`,
          `list only scopes of ${(enclosing ?? []).join(", ")}, or widen the class's scopes`,
        );
    };
    /** One key with its earlier paths, or its refusal. */
    const add = (
      field: FieldIR,
      subject: string,
      path: string,
      renamed: readonly string[],
    ): void => {
      const typed = settingTypeOf(field);
      if (typed === undefined) {
        refuse(
          shape.file,
          "settings_unsupported_type",
          subject,
          `${subject} is a ${field.type.kind}, and no setting holds that type, so it would get no key`,
          'type it as boolean, number, string, a brand, an enum, PublicId<"conn">, or an array of strings or of an enum',
        );
        return;
      }
      keys.push({
        path,
        type: typed.type,
        ...(typed.options === undefined ? {} : { options: [...typed.options] }),
        ...(renamed.length === 0 ? {} : { renamed: [...renamed] }),
      });
    };

    for (const field of shape.fields) {
      const setting = settingFacetOf(ir, shape, field.name) ?? {};
      checkScopes(`${shape.name}.${field.name}`, setting["scopes"], classScopes);
      if (field.type.kind !== "schema") {
        add(field, `${shape.name}.${field.name}`, field.name, earlierPathsOf(field));
        continue;
      }
      const { name, module } = field.type;
      const section = ir.shapes.find(
        (candidate) => candidate.name === name && candidate.module === module,
      );
      if (section === undefined) {
        refuse(
          shape.file,
          "settings_unsupported_type",
          `${shape.name}.${field.name}`,
          `${shape.name}.${field.name} is a section ${name} that gen cannot read, so it would get no keys`,
          "declare the section as a schema class of this member",
        );
        continue;
      }
      for (const inner of section.fields) {
        const subject = `${name}.${inner.name}`;
        if (inner.type.kind === "schema") {
          refuse(
            shape.file,
            "settings_too_deep",
            subject,
            `${subject} is itself a schema, and a section nests one level deep`,
            "flatten the field into the section",
          );
          continue;
        }
        checkScopes(
          subject,
          settingFacetOf(ir, { name, module }, inner.name)?.["scopes"],
          scopesOf(setting["scopes"]) ?? classScopes,
        );
        add(inner, subject, `${field.name}.${inner.name}`, earlierPathsOf(inner, field));
      }
    }
    if (shape.base?.kind === "package") continue;
    const other = owners.get(key);
    if (other !== undefined)
      refuse(
        shape.file,
        "settings_group_conflict",
        key,
        `${shape.name} (${shape.file}) and ${other.name} (${other.file}) both derive the settings group \`${key}\``,
        "rename one class so its stem differs, or override the other in src/overrides/",
      );
    else owners.set(key, shape);
    entries.push({
      key,
      class: shape.name,
      module: shape.module,
      file: shape.file,
      keys: keys as unknown as Json,
    });
  }

  // A group a dependency already records, or two dependencies that record one, has two owners.
  const recorded = new Map<string, string>();
  for (const dependency of ir.dependencies) {
    if (dependency.manifest["kind"] === "app") continue;
    const groups = (dependency.manifest["settings"] ?? []) as unknown as readonly SettingsEntry[];
    for (const group of groups) {
      const key = String(group["key"]);
      const first = recorded.get(key);
      const own = owners.get(key);
      if (own !== undefined)
        refuse(
          own.file,
          "settings_group_conflict",
          key,
          `${own.name} derives the settings group \`${key}\`, which ${dependency.package} already declares`,
          "rename the class so its stem differs, or override the dependency's class in src/overrides/",
        );
      else if (first !== undefined && first !== dependency.package)
        refuse(
          "stackra.manifest.json",
          "settings_group_conflict",
          key,
          `${first} and ${dependency.package} both declare the settings group \`${key}\``,
          "drop one dependency, or have one package rename its class",
        );
      recorded.set(key, dependency.package);
    }
  }

  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  entries.sort((a, b) => String(a["key"]).localeCompare(String(b["key"])));
  return { entries, errors };
}
