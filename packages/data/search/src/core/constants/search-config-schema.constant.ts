/**
 * Stackra file contract:
 * Purpose: `SEARCH_CONFIG_SCHEMA`, the zod schema this package ships for `SearchConfig` (exported as `SearchConfig$`):
 *          which driver runs, and the embedder (with the passage size the chunker cuts to).
 *          The `health` field tunes `SearchHealthIndicatorDriver` for `/readyz`.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `SearchConfig$` can `.extend` it. The default equals `SearchOptions`'
 *           initializer (tested). No credential: the Postgres driver uses the service's own database connection.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173 (no secret values in config:
 *                     the embedder token is a secret name); ADR 0404.
 */
import { z } from "zod";

import { HEALTH_CHECK_SCHEMA } from "#core/constants/health-check-schema.constant";
import { SEARCH_DRIVERS } from "#core/constants/search-drivers.constant";

/** The shipped `SearchConfig$`. */
export const SEARCH_CONFIG_SCHEMA = z.object({
  driver: z.enum(SEARCH_DRIVERS).default("postgres"),
  embedder: z
    .object({
      url: z.url().nullable().default(null),
      model: z.string().default(""),
      dimensions: z.number().int().min(1).max(16_000).default(1024),
      tokenSecret: z
        .string()
        .regex(/^[A-Z][A-Z0-9_]*$/)
        .nullable()
        .default(null),
      passageCharacters: z.number().int().min(100).max(100_000).default(2000),
      passageOverlap: z.number().int().min(0).max(10_000).default(200),
    })
    .refine((embedder) => embedder.passageOverlap < embedder.passageCharacters, {
      path: ["passageOverlap"],
      message: "passageOverlap is under passageCharacters",
    })
    .default(() => ({
      url: null,
      model: "",
      dimensions: 1024,
      tokenSecret: null,
      passageCharacters: 2000,
      passageOverlap: 200,
    })),
  health: HEALTH_CHECK_SCHEMA,
});
