/**
 * Stackra file contract:
 * Purpose: `SEQUENCE_REGISTRY`, the locked key of each sequence class, which names its counter rows.
 * Boundary: internal; written only by `registerSequences`, read by `SequenceService`. A sequence with no row is refused
 *           rather than counted under its written key, so adding the registration later never splits a series.
 * Runtime: node
 * Governing contract: ADR 0342 (decision 1); ADR 0294 (decision 20: identities are derived and locked).
 */
import type { SequenceClass } from "#core/types/sequence-class.type";
import type { SequenceRegistration } from "#core/types/sequence-registration.type";

/** Sequence class to its registration. */
export const SEQUENCE_REGISTRY = new Map<SequenceClass, SequenceRegistration>();
