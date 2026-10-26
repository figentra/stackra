/**
 * Stackra file contract:
 * Purpose: `MobileApp`, one `mobile.<app>` entry of the root runway, or a white-label app's entry built from tenant
 *          data: template line, packages, asset and store paths, identity, capabilities, store accounts and EAS.
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decisions 2 and 8), ADR 0441 (decision 3).
 */
import type { z } from "zod";

import type { MOBILE_APP_SCHEMA } from "#core/constants/mobile-app-schema.constant";

/** One mobile app. */
export type MobileApp = z.output<typeof MOBILE_APP_SCHEMA>;
