/**
 * Stackra file contract:
 * Purpose: `SECRET_NAMES_SCHEMA`, a list of secret names in SCREAMING_SNAKE (`PRICING_API_KEY`), each once: the
 *          `secrets` of a member runway and the CI and gateway lists of the root runway.
 * Boundary: internal; names only. A runway never holds a secret value (ADR 0173), and nothing here reads one.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0173 (names in git, values never), ADR 0231 (SCREAMING_SNAKE).
 */
import { z } from "zod";

/** Unique SCREAMING_SNAKE names. */
export const SECRET_NAMES_SCHEMA = z
  .array(z.string().regex(/^[A-Z][A-Z0-9_]*$/, "Expected a SCREAMING_SNAKE secret name"))
  .refine((names) => new Set(names).size === names.length, "A secret is named more than once");
