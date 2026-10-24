/**
 * Stackra file contract:
 * Purpose: `RootRunway`, the parsed root `runway.yaml` (defaults applied), as `parseRunway("root", …)` returns it.
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 2).
 */
import type { z } from "zod";

import type { ROOT_RUNWAY_SCHEMA } from "#core/constants/root-runway-schema.constant";

/** The root runway. */
export type RootRunway = z.output<typeof ROOT_RUNWAY_SCHEMA>;
