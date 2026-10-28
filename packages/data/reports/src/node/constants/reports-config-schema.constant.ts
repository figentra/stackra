/**
 * Stackra file contract:
 * Purpose: `REPORTS_CONFIG_SCHEMA`, the zod schema of the report runner's configuration (`ReportsConfig$`): the page
 *          size when a request names none, the row cap (the most groups one run reads), the statement timeout and
 *          whether runs go to the read replica, the report engine runs execute on (`postgres`), and the product
 *          analytics driver (`posthog`) with the PostHog project it queries.
 * Boundary: the stand-in for what gen will write for this package. Defaults only; a host or runway layer overrides them.
 * Runtime: isomorphic
 * Governing contract: ADR 0363 (configuration, not code); ADR 0470 (decision 3: replica by default, timeout, row cap;
 *                     decision 8: the engine is configuration); ADR 0163 (decision 5 as amended 2026-10-28); ADR 0173 (a
 *                     credential is a secret name, never a value).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

import { PRODUCT_ANALYTICS_DRIVERS } from "#node/constants/product-analytics-drivers.constant";
import { REPORT_ENGINES } from "#node/constants/report-engines.constant";

/** A duration in either form, stored canonical. */
const DURATION = z.string().transform((text, context): Duration => {
  try {
    return Duration.parse(text);
  } catch {
    context.addIssue({
      code: "custom",
      message: `"${text}" is not a duration such as PT30S or 30s`,
    });
    return z.NEVER;
  }
});

/** The shipped `ReportsConfig$`. */
export const REPORTS_CONFIG_SCHEMA = z.object({
  pageSize: z.number().int().min(1).max(10_000).default(100),
  maxRows: z.number().int().min(1).max(100_000).default(10_000),
  timeout: DURATION.default(Duration.seconds(30)),
  replica: z.boolean().default(true),
  engine: z.enum(REPORT_ENGINES).default("postgres"),
  productAnalytics: z.enum(PRODUCT_ANALYTICS_DRIVERS).default("posthog"),
  posthog: z
    .object({
      host: z.url().default("https://eu.posthog.com"),
      projectId: z
        .string()
        .regex(/^[0-9]+$/)
        .nullable()
        .default(null),
      keySecret: z
        .string()
        .regex(/^[A-Z][A-Z0-9_]*$/)
        .nullable()
        .default(null),
      scopeProperty: z
        .string()
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/)
        .nullable()
        .default("scope_id"),
    })
    .default(() => ({
      host: "https://eu.posthog.com",
      projectId: null,
      keySecret: null,
      scopeProperty: "scope_id",
    })),
});
