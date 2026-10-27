/**
 * Stackra file contract:
 * Purpose: `TelemetryOptions`, the shape of `TelemetryConfig`: what a client app or site reports about itself (the
 *          error reporter's DSN, error, trace and replay sampling, web vitals), its quality budgets and the paths and
 *          score floors of its Lighthouse run.
 * Boundary: a shape class; it registers this package's own schema (`TELEMETRY_CONFIG_SCHEMA`) for itself when the
 *           module loads. The defaults are dev-safe: nothing is reported, no session is replayed, the budgets are ADR
 *           0183's numbers and no Lighthouse path runs. Nested objects are replaced whole by a host override, which
 *           merges the base value explicitly. `replay.consent` is a consent category code (`crash_replay`), kept a
 *           string because consent sits above this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (telemetry); ADR 0183 (budgets with numbers); ADR 0071 (privacy); ADR 0294 (decisions
 *                     19 and 26).
 */
import { Field, registerSchemas, Schema } from "@stackra/validation";

import { TELEMETRY_CONFIG_SCHEMA } from "#core/constants/telemetry-config-schema.constant";

/**
 * A client's telemetry settings.
 *
 * @example
 * export class TelemetryConfig extends BaseTelemetryConfig {
 *   override errors = { ...new BaseTelemetryConfig().errors, enabled: true, sampleRate: 1 };
 *   override traces = { ...new BaseTelemetryConfig().traces, sampleRate: 0.1 };
 * }
 */
export class TelemetryOptions extends Schema {
  /** Error and crash reporting. */
  // reason: a nested object a host override replaces whole; the shipped schema already states its rule
  @Field(TELEMETRY_CONFIG_SCHEMA.shape.errors)
  errors: {
    /** Whether errors are reported at all. */
    enabled: boolean;
    /** The share of errors reported, 0 to 1. */
    sampleRate: number;
    /** Whether native crashes (mobile) are reported too. */
    nativeCrashes: boolean;
  } = { enabled: false, sampleRate: 1, nativeCrashes: false };

  /** Distributed tracing settings. */
  // reason: a nested object a host override replaces whole; the shipped schema already states its rule
  @Field(TELEMETRY_CONFIG_SCHEMA.shape.traces)
  traces: {
    /** The share of sessions or requests traced, 0 to 1. */
    sampleRate: number;
  } = { sampleRate: 0 };

  /** Session replay around an error. */
  // reason: a nested object a host override replaces whole; the shipped schema already states its rule
  @Field(TELEMETRY_CONFIG_SCHEMA.shape.replay)
  replay: {
    /** The share of errored sessions replayed, 0 to 1. */
    onErrorSampleRate: number;
    /** The consent category that must be granted before a replay starts; `null` when none is asked. */
    consent: string | null;
  } = { onErrorSampleRate: 0, consent: null };

  /** Core Web Vitals from real sessions. */
  // reason: a nested object a host override replaces whole; the shipped schema already states its rule
  @Field(TELEMETRY_CONFIG_SCHEMA.shape.vitals)
  vitals: {
    /** Whether vitals are collected. */
    enabled: boolean;
  } = { enabled: false };

  /** The quality budgets of ADR 0183. */
  // reason: a nested object a host override replaces whole; the shipped schema already states its rule
  @Field(TELEMETRY_CONFIG_SCHEMA.shape.budgets)
  budgets: {
    /** Largest Contentful Paint, milliseconds. */
    lcpMs: number;
    /** Interaction to Next Paint, milliseconds. */
    inpMs: number;
    /** Cumulative Layout Shift, a plain score. */
    cls: number;
    /** The entry chunk, gzipped kilobytes. */
    entryKb: number;
    /** One route chunk, gzipped kilobytes. */
    routeKb: number;
    /** Mobile cold start to first route, milliseconds. */
    coldStartMs: number;
  } = { lcpMs: 2500, inpMs: 200, cls: 0.1, entryKb: 200, routeKb: 100, coldStartMs: 2000 };

  /** What the e2e tier measures with Lighthouse. */
  // reason: a nested object a host override replaces whole; the shipped schema already states its rule
  @Field(TELEMETRY_CONFIG_SCHEMA.shape.lighthouse)
  lighthouse: {
    /** The paths measured, each starting with `/`; none by default. */
    paths: string[];
    /** Runs per path; the median counts. */
    runs: number;
    /** The lowest category scores accepted, 0 to 1. */
    minScores: { performance: number; accessibility: number; seo: number };
  } = { paths: [], runs: 3, minScores: { performance: 0.9, accessibility: 1, seo: 1 } };

  /** The error reporter's public DSN; the host feeds it from its env configuration. */
  dsn: string | null = null;
}

registerSchemas([[TelemetryOptions, TELEMETRY_CONFIG_SCHEMA]]);
