/**
 * Stackra file contract:
 * Purpose: `auditValues(structure, values)`, a command's bound values by command-line name for its audit entry, with
 *          the value of every secret field written `[redacted]`.
 * Boundary: pure; a field is secret as `isSecret` decides: declared `secret: true`, or its name ends in a
 *           `SECRET_FIELD_SUFFIXES` entry and it does not declare `secret: false`. Fields with no value are left out.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-016; ADR 0506 (amendment 2026-11-03).
 */
import { isSecret } from "#core/functions/is-secret.function";
import type { CommandStructure } from "#contracts/types/command-structure.type";

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
