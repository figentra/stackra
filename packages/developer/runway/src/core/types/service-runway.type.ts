/**
 * Stackra file contract:
 * Purpose: `ServiceRunway`, a parsed service member `runway.yaml` (defaults applied), as `parseRunway("service", …)`
 *          returns it.
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1).
 */
import type { z } from "zod";

import type { SERVICE_RUNWAY_SCHEMA } from "#core/constants/service-runway-schema.constant";

/** A service runway. */
export type ServiceRunway = z.output<typeof SERVICE_RUNWAY_SCHEMA>;
