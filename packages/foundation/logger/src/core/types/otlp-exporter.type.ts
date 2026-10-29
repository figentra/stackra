/**
 * Stackra file contract:
 * Purpose: `OtlpExporter<T>`, the batching sender every OTLP driver of this package shares: it queues items, POSTs
 *          them in batches to one OTLP/HTTP signal path and counts what it had to drop.
 * Boundary: a type only; `otlpExporter` builds one. `push` is synchronous and never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decisions 1 and 2); ADR 0147 (decision 1).
 */

/** A batching OTLP sender of items of type `T`. */
export interface OtlpExporter<T> {
  /** Queues `item`; a full batch is sent at once, the rest after the flush interval. */
  push: (item: T) => void;

  /** Sends every queued item and resolves once every send has finished or failed. */
  flush: () => Promise<void>;

  /** Items dropped so far: past `maxQueue`, or in a batch the collector refused or never answered. */
  readonly dropped: number;
}
