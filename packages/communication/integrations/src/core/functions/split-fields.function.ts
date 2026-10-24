/**
 * Stackra file contract:
 * Purpose: `splitFields`, which parts a connection's field values into its plain fields and its `@Secret` fields, as
 *          the class's `@Secret` decorators mark them.
 * Boundary: internal; the stores and `makeConnection` call it. A secret field's value must be a string; an undefined
 *           value is left out, so an optional field falls back to the Integration.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2 and 3); ADR 0173 (secrets by name).
 */
import { Secret } from "@stackra/config";

import type { ConnectionClass } from "#core/types/connection-class.type";

/**
 * The plain and secret fields of `values`.
 *
 * @throws TypeError when a `@Secret` field's value is not a string.
 * @example
 * splitFields(ResendConnection, { apiKey, fromAddress, webhookSecret }); // { fields: { fromAddress }, secrets: { apiKey, webhookSecret } }
 */
export function splitFields(
  type: ConnectionClass,
  values: object,
): { fields: Record<string, unknown>; secrets: Record<string, string> } {
  const secretFields = Secret.members(type);
  const fields: Record<string, unknown> = {};
  const secrets: Record<string, string> = {};
  for (const [field, value] of Object.entries(values)) {
    if (value === undefined) continue;
    if (!secretFields.has(field)) fields[field] = value;
    else if (typeof value === "string") secrets[field] = value;
    else throw new TypeError(`${type.name}.${field} is a @Secret field, so its value is a string`);
  }
  return { fields, secrets };
}
