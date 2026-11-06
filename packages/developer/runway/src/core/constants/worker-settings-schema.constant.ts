/**
 * Stackra file contract:
 * Purpose: `WORKER_SETTINGS_SCHEMA`, the operational settings of one Cloudflare Worker that `runway.yaml` owns: its
 *          compatibility date and flags, `workers.dev` and Version URLs, observability, limits, source maps,
 *          dashboard-kept vars and its Custom Domains. Every key is optional, so the same shape types a preset, the repository's defaults and
 *          a member's own overrides; `WORKER_BASE` and `WORKER_PRESETS` fill the rest.
 * Boundary: internal; validation only, no defaults (the layers merge in `workerSettingsOf`). Code facts (name, main,
 *           bindings, crons) stay in the member's `wrangler.jsonc`. Access and logpush arrive with the
 *           renderer (ADR 0519 decisions 3 and 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decision 1), ADR 0352; STA-1988.
 */
import { z } from "zod";

import { COMPATIBILITY_DATE_SCHEMA } from "#core/constants/compatibility-date-schema.constant";

/** Workers Logs, traces, sampling and Issues. */
const OBSERVABILITY_SCHEMA = z.strictObject({
  logs: z.boolean().optional(),
  invocationLogs: z.boolean().optional(),
  traces: z.boolean().optional(),
  headSamplingRate: z.number().min(0).max(1).optional(),
  issues: z.boolean().optional(),
  redactQueryString: z.boolean().optional(),
});

/** The operational settings of one Worker. */
export const WORKER_SETTINGS_SCHEMA = z.strictObject({
  compatibilityDate: COMPATIBILITY_DATE_SCHEMA.optional(),
  compatibilityFlags: z.array(z.string().min(1)).optional(),
  workersDev: z.boolean().optional(),
  previewUrls: z.boolean().optional(),
  observability: OBSERVABILITY_SCHEMA.optional(),
  limits: z.strictObject({ cpuMs: z.int().positive() }).optional(),
  cache: z.boolean().optional(),
  uploadSourceMaps: z.boolean().optional(),
  keepVars: z.boolean().optional(),
  /** Hosts served as Workers Custom Domains, rendered as wrangler `routes` with `custom_domain: true` (ADR 0519). */
  customDomains: z
    .array(
      z
        .string()
        .regex(
          /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/,
          "Expected a host name such as env-sync.stackra.figentra.com",
        ),
    )
    .min(1)
    .optional(),
  /** Traffic steps of a production deploy, ascending and ending at 100; unset ships all at once. */
  rollout: z
    .array(z.int().min(1).max(100))
    .min(1)
    .refine(
      (steps) =>
        steps.at(-1) === 100 && steps.every((step, i) => i === 0 || step > (steps[i - 1] ?? 0)),
      "Expected ascending percentages ending at 100",
    )
    .optional(),
});
