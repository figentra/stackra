/**
 * Stackra file contract:
 * Purpose: `ClientRefusalOptions`, the one argument of `ClientRefusal({...})`: the refusal ref options with the
 *          module-qualified code inside.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope); ADR 0305 (kind factories take no `define` prefix).
 */
import type { RefusalRefOptions } from "#core/types/refusal-ref-options.type";

/** What `ClientRefusal` declares. */
export interface ClientRefusalOptions extends RefusalRefOptions {
  /** The module-qualified code (`leads.rate_limited`). */
  readonly code: string;
}
