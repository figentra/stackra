/**
 * Stackra file contract:
 * Purpose: `CrossAppEnvelope`, an integration event on its way to a consumer in another app: the `EventEnvelope` plus
 *          `envelopeVersion` and, once the consumer's inbox verified the sender, `producer`.
 * Boundary: a type only, JSON-safe. The producer never sends `producer`; the inbox sets it from the verified sender's
 *           service and ignores any value the body carries. The field names stay the code's (ADR 0511 decision 19).
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 11 and 19, amendment of 2026-11-02); ADR 0141 (decision 2).
 */
import type { EventEnvelope } from "#contracts/types/event-envelope.type";

/** An integration event that crosses apps. */
export interface CrossAppEnvelope extends EventEnvelope {
  /** The version of this envelope's shape; `1`. */
  readonly envelopeVersion: number;

  /** The verified producer service; set by the consumer's inbox only, never sent. */
  readonly producer?: string;
}
