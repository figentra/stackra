/**
 * Stackra file contract:
 * Purpose: `kindOf`, which reads the kind and options of a class from the kind registry, walking up its constructor
 *          chain, so a subclass (an author's class, a host override) reads the record of its nearest kind base.
 * Boundary: reads the registry only; no reflect-metadata and no `design:*` read.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25); ADR 0227 2026-10-24 note.
 */
import { KIND_RECORDS } from "#core/constants/kind-records.constant";
import type { KindRecord } from "#core/types/kind-record.type";

/**
 * The kind of `type` and the options its nearest called base was given.
 *
 * @returns undefined for a class that extends no kind base.
 * @example
 * kindOf(LoyaltyKitModule); // { kind: "module", options: { exports: [LoyaltyService] } }
 */
export function kindOf(type: object): KindRecord | undefined {
  for (
    let current: object | null = type;
    current !== null && current !== Function.prototype;
    current = Object.getPrototypeOf(current) as object | null
  ) {
    const record = KIND_RECORDS.get(current);
    if (record !== undefined) return record;
  }
  return undefined;
}
