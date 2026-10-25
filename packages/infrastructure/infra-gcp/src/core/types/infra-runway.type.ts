/**
 * Stackra file contract:
 * Purpose: `InfraRunway`, the root runway narrowed to what the GCP foundation reads, as `parseInfraRunway` returns it.
 * Boundary: internal; type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 2), ADR 0354.
 */
import type { z } from "zod";

import type { INFRA_RUNWAY_SCHEMA } from "#core/constants/infra-runway-schema.constant";

/** The narrowed root runway. */
export type InfraRunway = z.output<typeof INFRA_RUNWAY_SCHEMA>;
