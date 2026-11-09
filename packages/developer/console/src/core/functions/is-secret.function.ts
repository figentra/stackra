/**
 * Stackra file contract:
 * Purpose: `isSecret(field)`, whether a command field's value must never be kept or shown: it is declared
 *          `secret: true`, or it declares no `secret` and its name ends in a `SECRET_FIELD_SUFFIXES` entry; an
 *          explicit `secret: false` wins over the name.
 * Boundary: pure; the name is compared in lower case without separators.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-016; ADR 0506 (amendment 2026-11-03).
 */
import { SECRET_FIELD_SUFFIXES } from "#core/constants/secret-field-suffixes.constant";
import type { CommandField } from "#contracts/types/command-field.type";

/** Whether `field`'s value must not be kept. */
export function isSecret(field: CommandField): boolean {
  const name = field.property.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
  return field.secret ?? SECRET_FIELD_SUFFIXES.some((suffix) => name.endsWith(suffix));
}
