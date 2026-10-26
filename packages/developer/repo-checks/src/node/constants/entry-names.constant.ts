/**
 * Stackra file contract:
 * Purpose: `ENTRY_NAMES`, the package entry names in exports order.
 * Boundary: data only, derived from `ENTRIES`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15).
 */
import { ENTRIES } from "#node/constants/entries.constant";

/** The entry name list, in exports order. */
export const ENTRY_NAMES: readonly string[] = Object.freeze(ENTRIES.map((e) => e.name));
