/**
 * Stackra file contract:
 * Purpose: `auditValues(structure, values)`, a command's bound values by command-line name for its audit entry, with
 *          the value of every secret field written `[redacted]`.
 * Boundary: pure; a field is secret when it is declared `secret: true` or its name ends in a `SECRET_FIELD_SUFFIXES`
 *           entry. Fields with no value are left out.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-016.
 */
import { SECRET_FIELD_SUFFIXES } from "#core/constants/secret-field-suffixes.constant";
import type { CommandField } from "#core/types/command-field.type";
import type { CommandStructure } from "#core/types/command-structure.type";

/** Whether `field`'s value must not be kept. */
const isSecret = (field: CommandField) => {
  const name = field.property.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
  return field.secret === true || SECRET_FIELD_SUFFIXES.some((suffix) => name.endsWith(suffix));
};

/**
 * The audit values of a run.
 *
 * @example
 * auditValues(structure, { name: "acme", apiKey: "s3cr3t" }); // { name: "acme", "api-key": "[redacted]" }
 */
export function auditValues(
  structure: CommandStructure,
  values: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of [...structure.arguments, ...structure.options]) {
    const value = values[field.property] ?? field.default;
    if (value !== undefined) out[field.flag] = isSecret(field) ? "[redacted]" : value;
  }
  return out;
}
