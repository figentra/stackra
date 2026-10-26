/**
 * Stackra file contract:
 * Purpose: `StorefrontPolicy`, a storefront's edge settings as `parseStorefront` returns them (defaults applied): how a
 *          shopper is told apart, and each campaign's host, path, waiting room and per-shopper limits.
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0402.
 */
import type { z } from "zod";

import type { STOREFRONT_SCHEMA } from "#core/constants/storefront-schema.constant";

/** A storefront's edge settings. */
export type StorefrontPolicy = z.output<typeof STOREFRONT_SCHEMA>;
