/**
 * Stackra file contract:
 * Purpose: `settingTypeOf`, the `SettingType` code of a settings field: a boolean, an `@Int` number (`integer`), a
 *          number, a string or a brand (`string`), a `PublicId<"conn">` (`connection`), an enum or a `DriverName<Port>`
 *          (`choice` with its `options`), and an array of strings or brands (`list`), or of an enum (`list` with
 *          `options`).
 * Boundary: pure; undefined for every other type (json, money, date, record, a schema, an array of those), which
 *           `settingsOf` refuses as `settings_unsupported_type`. Only a connection id refers to a credential
 *           (ADR 0307 rule 23).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 and 23); ADR 0496 (decision 9).
 */
import type { FieldIR } from "#core/types/field-ir.type";
import type { TypeDesc } from "#core/types/type-desc.type";

/** The type and options of one setting key. */
interface SettingTypeOf {
  /** The `SettingType` code. */
  readonly type: string;

  /** The closed texts of a choice or of each item of a list. */
  readonly options?: readonly string[];
}

/** The type of one value, not an array. */
function scalarOf(type: TypeDesc, integer: boolean): SettingTypeOf | undefined {
  if (type.kind === "boolean") return { type: "boolean" };
  if (type.kind === "number") return { type: integer ? "integer" : "number" };
  if (type.kind === "public_id" && type.prefix === "conn" && type.prefixes === undefined)
    return { type: "connection" };
  if (type.kind === "string" || type.kind === "brand") return { type: "string" };
  if (type.kind === "enum" || type.kind === "driver_name")
    return { type: "choice", options: [...type.values] };
  return undefined;
}

/**
 * The setting type of `field`, or undefined when no `SettingType` holds it.
 *
 * @example
 * settingTypeOf(field); // { type: "choice", options: ["open", "closed"] }
 */
export function settingTypeOf(field: FieldIR): SettingTypeOf | undefined {
  const { type } = field;
  if (type.kind === "array") {
    const element = scalarOf(type.element, false);
    if (element?.type === "string") return { type: "list" };
    if (element?.type === "choice") return { type: "list", options: element.options ?? [] };
    return undefined;
  }
  return scalarOf(
    type,
    field.rules.some((rule) => rule.name === "Int"),
  );
}
