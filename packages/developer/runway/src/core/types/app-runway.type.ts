/**
 * Stackra file contract:
 * Purpose: `AppRunway`, a parsed app member `runway.yaml` (defaults applied), as `parseRunway("app", …)` returns it.
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1).
 */
import type { z } from "zod";

import type { APP_RUNWAY_SCHEMA } from "#core/constants/app-runway-schema.constant";

/** An app runway. */
export type AppRunway = z.output<typeof APP_RUNWAY_SCHEMA>;
