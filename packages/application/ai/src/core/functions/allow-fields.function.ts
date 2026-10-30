/**
 * Stackra file contract:
 * Purpose: `allowFields(facts, dataClass, allowList)`, the context of one data class cut down to the fields its
 *          allow-list names, before it reaches a model.
 * Boundary: pure; deny by default: a class with no list, or a path that is absent, contributes nothing. Paths are
 *           dotted (`customer.firstName`); a path ending on an object copies that object whole, so list leaves for
 *           anything nested that may hold more than the list means.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decision 15); ADR 0494 (a credential contributes nothing).
 */
import type { FieldAllowList } from "#core/types/field-allow-list.type";

/** A plain object. */
const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The allowed part of `facts`.
 *
 * @example
 * allowFields({ id: "cus_1", email: "a@b.c", tier: "gold" }, "customer", { customer: ["id", "tier"] });
 * // { id: "cus_1", tier: "gold" }
 */
export function allowFields(
  facts: Readonly<Record<string, unknown>>,
  dataClass: string,
  allowList: FieldAllowList,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (dataClass === "credential") return out; // never in a model's context, whatever the list says (ADR 0494)
  for (const path of Object.hasOwn(allowList, dataClass) ? (allowList[dataClass] ?? []) : []) {
    const parts = path.split(".");
    let value: unknown = facts;
    for (const part of parts)
      value = isRecord(value) && Object.hasOwn(value, part) ? value[part] : undefined;
    if (value === undefined) continue;
    let target = out;
    for (const part of parts.slice(0, -1)) {
      if (!isRecord(target[part])) target[part] = {};
      target = target[part] as Record<string, unknown>;
    }
    target[parts.at(-1) as string] = value;
  }
  return out;
}
