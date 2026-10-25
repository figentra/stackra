/**
 * Stackra file contract:
 * Purpose: `EdgePolicy`, the root runway's `edge` block as `parseEdge` returns it (defaults applied).
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0175 (decision 1), ADR 0217 (decisions 2 and 3), ADR 0325 (rule 24).
 */
import type { z } from "zod";

import type { EDGE_SCHEMA } from "#core/constants/edge-schema.constant";

/** The edge policy every edge zone applies. */
export type EdgePolicy = z.output<typeof EDGE_SCHEMA>;
