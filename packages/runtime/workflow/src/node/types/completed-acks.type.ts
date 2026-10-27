/**
 * Stackra file contract:
 * Purpose: `CompletedAcks`, what `ServiceAckService.ack` returns for the ack that completes a set: the expected
 *          services and what each kept.
 * Boundary: a type only; a service that kept nothing is absent from `kept`.
 * Runtime: node
 * Governing contract: ADR 0210 (decision 6); STA-1312.
 */
import type { KeptRecords } from "#core/index";

/** A completed ack set. */
export interface CompletedAcks {
  /** The member keys of the expected services, in order. */
  readonly services: readonly string[];

  /** What each service kept, by member key. */
  readonly kept: Readonly<Record<string, readonly KeptRecords[]>>;
}
