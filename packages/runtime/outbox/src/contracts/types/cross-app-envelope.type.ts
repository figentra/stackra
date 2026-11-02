/**
 * Stackra file contract:
 * Purpose: `CrossAppEnvelope`, an integration event on its way to or from another app: the `EventEnvelope` plus the
 *          version of this envelope and, once a consumer's inbox has verified the sender, the producer service.
 * Boundary: a type only, JSON-safe. A producer never sends `producer`; the inbox sets it from the contract whose key
 *           verified the request, never from the body. The field names are the code's envelope (ADR 0511 decision 19).
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 11 and 16 to 19); ADR 0141 (decision 2, 2026-11-01 note).
 */
import type { EventEnvelope } from "#contracts/types/event-envelope.type";

/** An integration event crossing apps. */
export interface CrossAppEnvelope extends EventEnvelope {
  /** The version of this envelope's form. */
  readonly envelopeVersion: 1;

  /** The verified producer service (`payments`); set by the consumer's inbox, absent on the wire. */
  readonly producer?: string;
}
