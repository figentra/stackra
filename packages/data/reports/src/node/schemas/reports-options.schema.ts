/**
 * Stackra file contract:
 * Purpose: `ReportsOptions`, the shape of `ReportsConfig`: the default page size, the row cap, the statement timeout
 *          and whether report runs go to the read replica.
 * Boundary: a schema class over `REPORTS_CONFIG_SCHEMA`; its initializers equal the shipped defaults (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0363; ADR 0470 (decision 3); ADR 0095 as amended by ADR 0294.
 */
import { Duration } from "@stackra/contracts";
import { Field, Int, registerSchemas, Schema } from "@stackra/validation";

import { REPORTS_CONFIG_SCHEMA } from "#node/constants/reports-config-schema.constant";

/** What the report runner reads from configuration. */
export class ReportsOptions extends Schema {
  /** Groups per page when a request names no limit. */
  @Int({
    min: 1,
    max: 10_000,
  })
  pageSize = 100;

  /** The most groups one run reads, across pages; a page and the cursor stop there. */
  @Int({
    min: 1,
    max: 100_000,
  })
  maxRows = 10_000;

  /** The statement timeout of one run, replacing the session's. */
  // reason: a Duration field; the package's own shipped schema reads both duration forms
  @Field(REPORTS_CONFIG_SCHEMA.shape.timeout)
  timeout: Duration = Duration.seconds(30);

  /** Whether runs read the read replica (it may trail a write by the replica's lag). */
  // reason: a boolean with a default; no decorator covers it
  @Field(REPORTS_CONFIG_SCHEMA.shape.replica)
  replica = true;
}

registerSchemas([[ReportsOptions, REPORTS_CONFIG_SCHEMA]]);
