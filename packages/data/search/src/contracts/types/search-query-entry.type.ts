/**
 * Stackra file contract:
 * Purpose: `SearchQueryEntry`, one record of the search query log: a sampled read (its phrase, hit count and latency)
 *          or a click on one of its results.
 * Boundary: a type only. The phrase is the normalised words, or `null` when the PII check withheld it (the model
 *           searches a classified field, or the phrase looks like an e-mail address or a long number), so the counts
 *           still land. The scope is the session's, never input.
 * Runtime: isomorphic
 * Governing contract: ADR 0221; ADR 0341 and ADR 0380 (data classes); ADR 0327 (a scope is a `ScopeRef`);
 *                     data-layer gap se12 (stackra-326).
 */
import type { ScopeRef } from "@stackra/contracts";

/** One logged read or click. */
export interface SearchQueryEntry {
  /** The model's class name. */
  readonly model: string;

  /** The normalised phrase, or `null` when withheld. */
  readonly phrase: string | null;

  /** How many rows the read returned; absent for a click. */
  readonly hits?: number;

  /** How long the read took, in milliseconds; absent for a click. */
  readonly latencyMs?: number;

  /** The id of the result clicked; absent for a read. */
  readonly clicked?: string;

  /** The scope the read ran in; absent for a platform read. */
  readonly scope?: ScopeRef;
}
