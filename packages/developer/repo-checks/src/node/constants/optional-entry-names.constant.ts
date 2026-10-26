/**
 * Stackra file contract:
 * Purpose: `OPTIONAL_ENTRY_NAMES`, the entries `--entries` may add; the others come with every package.
 * Boundary: data only, derived from `ENTRIES`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15).
 */
import { ENTRIES } from "#node/constants/entries.constant";

/** The entries `--entries` may add; the others come with every package. */
export const OPTIONAL_ENTRY_NAMES: readonly string[] = Object.freeze(
  ENTRIES.filter((e) => e.optional).map((e) => e.name),
);
