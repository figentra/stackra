/**
 * Stackra file contract:
 * Purpose: `UsageReportPayload`, what an on-prem install signs for its periodic usage report: the licence, the period
 *          and the quantity per meter. The signed bytes are `usageReportMessage` of it.
 * Boundary: a type only, plain JSON. Field for field the OS licensing service's `UsageReportPayloadV1`, so the bytes an
 *           install signs here are the bytes the import verifies there. A breaking change is a new `version`.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decision 5); ADR 0416 (one canonical form for signatures); OS ADR 0039 d8.
 */

/** The signed body of one usage report. */
export interface UsageReportPayload {
  /** The payload schema version. */
  readonly version: 1;

  /** The licence's id, as its file states it. */
  readonly licenceId: string;

  /** First instant of the period, inclusive, ISO 8601 UTC. */
  readonly periodStart: string;

  /** Last instant of the period, exclusive, ISO 8601 UTC. */
  readonly periodEnd: string;

  /** Meter key to the quantity used in the period; whole units. */
  readonly lines: Readonly<Record<string, number>>;
}
