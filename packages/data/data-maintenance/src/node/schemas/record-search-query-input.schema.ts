/**
 * Stackra file contract:
 * Purpose: `RecordSearchQueryInput`, the input of the query log job: one sampled read or result click of a model.
 * Boundary: a shape class in its own file; `QueuedSearchQueryLogDriver.record` fills it from a `SearchQueryEntry`.
 *           A withheld phrase is absent. The scope is the job's, never input. It registers its schema when the module
 *           loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); data-layer gap se12
 *                     (stackra-326).
 */
import { Int, registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/**
 * One logged read or click.
 *
 * @example
 * RecordSearchQueryInput.create({ model: "Product", phrase: "linen shirt", hits: 12, latencyMs: 18 });
 */
export class RecordSearchQueryInput extends Schema {
  /** The searched model's class name. */
  @Str({
    min: 1,
    max: 200,
  })
  model!: string;

  /** The normalised phrase; absent when withheld. */
  @Str({
    min: 1,
    max: 500,
  })
  phrase?: string;

  /** Rows the read returned; absent for a click. */
  @Int({ min: 0 })
  hits?: number;

  /** How long the read took in milliseconds; absent for a click. */
  @Int({ min: 0 })
  latencyMs?: number;

  /** The id of the result clicked; absent for a read. */
  @Str({
    min: 1,
    max: 64,
  })
  clicked?: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    RecordSearchQueryInput,
    z.object({
      model: z.string().min(1).max(200),
      phrase: z.string().min(1).max(500).optional(),
      hits: z.number().int().min(0).optional(),
      latencyMs: z.number().int().min(0).optional(),
      clicked: z.string().min(1).max(64).optional(),
    }),
  ],
]);
