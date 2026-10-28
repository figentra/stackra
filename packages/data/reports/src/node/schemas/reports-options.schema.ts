/**
 * Stackra file contract:
 * Purpose: `ReportsOptions`, the shape of `ReportsConfig`: the default page size, the row cap, the statement timeout
 *          whether report runs go to the read replica, which `ReportEngine` driver runs them, and which
 *          `ProductAnalytics` driver computes funnels, retention and cohorts, with the PostHog project it reads.
 * Boundary: a schema class over `REPORTS_CONFIG_SCHEMA`; its initializers equal the shipped defaults (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0363; ADR 0470 (decisions 3 and 8); ADR 0163 (decision 5 as amended 2026-10-28); ADR 0173; ADR 0095 as amended by ADR 0294.
 */
import "#node/types/report-engine-driver-registry.type";
import type { DriverName } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { Field, Int, registerSchemas, Schema } from "@stackra/validation";

import type { ProductAnalytics } from "#contracts/ports/product-analytics.port";
import type { ReportEngine } from "#contracts/ports/report-engine.port";
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

  /**
   * The PostHog project the `posthog` product analytics driver queries. No credential is a field, only the name of the
   * runtime secret holding a personal API key with query read access (ADR 0173).
   */
  // reason: a nested driver option a host override replaces whole; the shipped config schema holds its rules
  @Field(REPORTS_CONFIG_SCHEMA.shape.posthog)
  posthog: {
    /** The PostHog app host (`https://eu.posthog.com`, `https://us.posthog.com` or a self-hosted origin). */
    host: string;
    /** The numeric project id; `null` while none is configured. */
    projectId: string | null;
    /** The secret holding the personal API key, read through `SecretStore`; `null` while none is configured. */
    keySecret: string | null;
    /**
     * The event property holding the caller's scope id, which every query is narrowed to; `null` only for a project
     * that holds a single scope's events (such as Stackra's own product analytics, ADR 0190 decision 2).
     */
    scopeProperty: string | null;
  } = {
    host: "https://eu.posthog.com",
    projectId: null,
    keySecret: null,
    scopeProperty: "scope_id",
  };

  /** The `ReportEngine` driver runs execute on: `postgres`; the Pro OLAP engines join with stackra-417. */
  engine: DriverName<ReportEngine> = "postgres";

  /** The `ProductAnalytics` driver funnels, retention and cohorts run on: `posthog`. */
  productAnalytics: DriverName<ProductAnalytics> = "posthog";
}

registerSchemas([[ReportsOptions, REPORTS_CONFIG_SCHEMA]]);
