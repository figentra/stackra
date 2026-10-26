/**
 * Stackra file contract:
 * Purpose: `EnvironmentCloud`, the `cloud` of a root environment or dedicated deployment as parsed: the cloud and the
 *          key of the account or project that holds it.
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decision 4), ADR 0400.
 */
import type { z } from "zod";

import type { ENVIRONMENT_CLOUD_SCHEMA } from "#core/constants/environment-cloud-schema.constant";

/** One environment's cloud. */
export type EnvironmentCloud = z.output<typeof ENVIRONMENT_CLOUD_SCHEMA>;
