/**
 * Stackra file contract:
 * Purpose: `factsOf`, the facts a step's `when` tests: a trigger occurrence's JSON read as the block's fields under
 *          the `trigger` source.
 * Boundary: internal and pure. The block's own `read` wins; otherwise each declared field is read as it is and a date
 *           field's ISO text as a `Date` (a money field needs the block's `read`, which builds a `Money`). A field the
 *           occurrence lacks is missing, which only `is_not_set` matches.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 4 and 6); ADR 0153 (decision 1).
 */
import type { Facts, FactValue } from "@stackra/rules";
import { FieldType } from "@stackra/rules/contracts";

import type { BuildingBlock } from "#core/types/building-block.type";

/**
 * The facts of `payload` for `block`.
 *
 * @example
 * factsOf(ORDER_PAID, { total: 120, paidAt: "2026-10-25T09:00:00Z" }); // { trigger: { total: 120, paidAt: Date } }
 */
export function factsOf(block: BuildingBlock, payload: unknown): Facts {
  const record =
    typeof payload === "object" && payload !== null && !Array.isArray(payload)
      ? (payload as Readonly<Record<string, unknown>>)
      : {};
  if (block.read !== undefined) return { trigger: block.read(record) };
  const trigger: Record<string, FactValue | null | undefined> = {};
  for (const [name, field] of Object.entries(block.facts ?? {})) {
    const value = record[name];
    trigger[name] =
      field.type === FieldType.Date && typeof value === "string"
        ? new Date(value)
        : (value as FactValue | null | undefined);
  }
  return { trigger };
}
