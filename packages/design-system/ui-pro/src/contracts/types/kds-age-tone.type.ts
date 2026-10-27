/**
 * Stackra file contract:
 * Purpose: one step of a KDS ticket's age colours: from how many minutes a ticket is drawn in which tone.
 * Boundary: types only. The steps are a setting the caller reads (per venue or station), never defaults here.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); config-model section 1 (business values are settings).
 */
import type { Tone } from "@stackra/ui/contracts";

/** One step of the ticket age colours. */
export interface KdsAgeTone {
  /** The age in minutes from which the tone applies. */
  readonly fromMinutes: number;
  /** The tone. */
  readonly tone: Tone;
}
