/**
 * Stackra file contract:
 * Purpose: `RunwayFacts`, the resolved runway facts (defaults applied): the content of `.stackra/dev/ports.json`, or
 *          the one-member document `definesFor` injects into a bundle.
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0295 (decision 5).
 */
import type { z } from "zod";

import type { RUNWAY_FACTS_SCHEMA } from "#core/constants/runway-facts-schema.constant";

/** Resolved runway facts. */
export type RunwayFacts = z.output<typeof RUNWAY_FACTS_SCHEMA>;
