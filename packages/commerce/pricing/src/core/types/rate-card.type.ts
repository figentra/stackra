/**
 * Stackra file contract:
 * Purpose: `RateCard`, one parsed `rate-card:<name>` version: its metered rates and its prepaid packs.
 * Boundary: a type only; `rateCardOf` builds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 1); config-model section 2.
 */
import type { PrepaidPack } from "#core/types/prepaid-pack.type";
import type { RateCardLine } from "#core/types/rate-card-line.type";

/** One rate card. */
export interface RateCard {
  /** The record key (`rate-card:messaging`). */
  readonly key: string;

  /** Metered rates, one per meter and currency. */
  readonly lines: readonly RateCardLine[];

  /** Prepaid packs. */
  readonly packs: readonly PrepaidPack[];
}
