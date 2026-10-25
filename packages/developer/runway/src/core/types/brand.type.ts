/**
 * Stackra file contract:
 * Purpose: `Brand`, one per-brand build of an app member: key, name, tokens overlay path and app and bundle ids.
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decision 8).
 */
import type { z } from "zod";

import type { BRAND_SCHEMA } from "#core/constants/brand-schema.constant";

/** A brand build of an app member. */
export type Brand = z.output<typeof BRAND_SCHEMA>;
