/**
 * Stackra file contract:
 * Purpose: `GITHUB_SECTION_SCHEMA`, the root runway's `providers.github` block as a closed object, so a misspelt key
 *          fails `parseRunway` instead of passing silently.
 * Boundary: internal; validation only, with no defaults. infra-github stays authoritative and parses the block with
 *           its own `GITHUB_PROVIDER_SCHEMA`. It depends on @stackra/runway, so this mirrors its keys and value rules
 *           rather than import them; a key added there is added here in the same change.
 * Runtime: isomorphic
 * Governing contract: ADR 0296; ADR 0468 (environments and reviewers); ADR 0534 (description, topics, homepage); the Runway inventory of 2026-11-02 (static/
 *                     finding 1); STA-1976.
 */
import { z } from "zod";

/** Branch or tag patterns (`main`, `schemas@*`). */
const PATTERNS = z.array(z.string().min(1)).min(1);

/** Actions variables: a SCREAMING_SNAKE name outside `GITHUB_`, a public value or `ref:<path>`. */
const VARIABLES = z.record(
  z
    .string()
    .regex(/^(?!GITHUB_)[A-Z][A-Z0-9_]*$/, "Expected a SCREAMING_SNAKE name outside GITHUB_"),
  z.union([z.string(), z.number(), z.boolean()]),
);

/** `providers.github`, as infra-github's `GITHUB_PROVIDER_SCHEMA` reads it (ADR 0468). */
export const GITHUB_SECTION_SCHEMA = z.strictObject({
  org: z
    .string()
    .regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/, "Expected a GitHub organisation login"),
  repo: z.string().regex(/^[A-Za-z0-9._-]+$/, "Expected a GitHub repository name"),
  visibility: z.enum(["private", "public", "internal"]).optional(),
  // The repository metadata standard (ADR 0534).
  description: z.string().trim().min(1).max(350, "GitHub allows 350 characters").optional(),
  topics: z
    .array(
      z
        .string()
        .regex(
          /^[a-z0-9][a-z0-9-]{0,49}$/,
          "Expected a lower-case GitHub topic of at most 50 characters",
        ),
    )
    .max(20, "GitHub allows 20 topics")
    .refine((topics) => new Set(topics).size === topics.length, "List each topic once")
    .optional(),
  homepage: z.string().url("Expected an absolute URL").optional(),
  variables: VARIABLES.optional(),
  environments: z
    .record(
      z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a lower-case environment name"),
      z.strictObject({
        reviewers: z
          .array(
            z
              .string()
              .regex(
                /^[A-Za-z0-9-]+(?:\/[A-Za-z0-9._-]+)?$/,
                "Expected a user login or <org>/<team-slug>",
              ),
          )
          .max(6, "GitHub allows six reviewers per environment")
          .optional(),
        branches: PATTERNS.optional(),
        tags: PATTERNS.optional(),
        variables: VARIABLES.optional(),
      }),
    )
    .optional(),
});
