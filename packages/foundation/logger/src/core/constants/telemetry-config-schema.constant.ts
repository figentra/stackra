/**
 * Stackra file contract:
 * Purpose: `TELEMETRY_CONFIG_SCHEMA`, the zod schema this package ships for `TelemetryConfig` (exported as
 *          `TelemetryConfig$`): the reporter DSN, error, trace and replay sampling, web vitals, the quality budgets and
 *          the Lighthouse run.
 * Boundary: the stand-in for what gen writes for this package. Every field and every nested field has a default, so
 *           `.parse({})` gives the full defaults, `.shape.<field>.parse(undefined)` gives a nested default and a host's
 *           generated `TelemetryConfig$` extends it with `Base$.shape.<field>.unwrap().default(...)`. The defaults
 *           equal `TelemetryOptions`' initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0184; ADR 0183 (budgets).
 */
import { z } from "zod";

/** A sampling rate: the share of events kept, 0 to 1. */
const RATE = z.number().min(0).max(1);

/** A budget or a score floor: never negative. */
const AMOUNT = z.number().min(0);

/** A Lighthouse category score floor, 0 to 1. */
const SCORE = z.number().min(0).max(1);

/** The shipped `TelemetryConfig$`. */
export const TELEMETRY_CONFIG_SCHEMA = z.object({
  dsn: z.url().nullable().default(null),
  errors: z
    .object({
      enabled: z.boolean().default(false),
      sampleRate: RATE.default(1),
      nativeCrashes: z.boolean().default(false),
    })
    .default(() => ({ enabled: false, sampleRate: 1, nativeCrashes: false })),
  traces: z.object({ sampleRate: RATE.default(0) }).default(() => ({ sampleRate: 0 })),
  replay: z
    .object({
      onErrorSampleRate: RATE.default(0),
      consent: z.string().nullable().default(null),
    })
    .default(() => ({ onErrorSampleRate: 0, consent: null })),
  vitals: z.object({ enabled: z.boolean().default(false) }).default(() => ({ enabled: false })),
  budgets: z
    .object({
      lcpMs: AMOUNT.default(2500),
      inpMs: AMOUNT.default(200),
      cls: AMOUNT.default(0.1),
      entryKb: AMOUNT.default(200),
      routeKb: AMOUNT.default(100),
      coldStartMs: AMOUNT.default(2000),
    })
    .default(() => ({
      lcpMs: 2500,
      inpMs: 200,
      cls: 0.1,
      entryKb: 200,
      routeKb: 100,
      coldStartMs: 2000,
    })),
  lighthouse: z
    .object({
      paths: z.array(z.string().startsWith("/")).default(() => []),
      runs: z.number().int().min(1).default(3),
      minScores: z
        .object({
          performance: SCORE.default(0.9),
          accessibility: SCORE.default(1),
          seo: SCORE.default(1),
        })
        .default(() => ({ performance: 0.9, accessibility: 1, seo: 1 })),
    })
    .default(() => ({
      paths: [],
      runs: 3,
      minScores: { performance: 0.9, accessibility: 1, seo: 1 },
    })),
});
