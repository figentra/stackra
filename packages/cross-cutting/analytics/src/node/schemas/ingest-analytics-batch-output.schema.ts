/**
 * Stackra file contract:
 * Purpose: `IngestAnalyticsBatchOutput`, what the ingest action answers: how many deliveries went on to at least one
 *          destination and how many were dropped (ADR 0483 decision 2).
 * Boundary: counts only; a refusal is an answer, never an error, so the client never retries refused data. Which
 *           destination took what is not told.
 * Runtime: node
 * Governing contract: ADR 0483 (decision 2); ADR 0305.
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * The counts of one ingested batch.
 *
 * @example
 * return IngestAnalyticsBatchOutput.create({ accepted: 18, dropped: 2 });
 */
export class IngestAnalyticsBatchOutput extends Schema {
  /** Deliveries published to at least one destination. */
  @Int({ min: 0 })
  accepted!: number;

  /** Deliveries no destination takes: refused consent, another subject, or routed nowhere. */
  @Int({ min: 0 })
  dropped!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    IngestAnalyticsBatchOutput,
    z.object({ accepted: z.number().int().min(0), dropped: z.number().int().min(0) }),
  ],
]);
