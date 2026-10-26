/**
 * Stackra file contract:
 * Purpose: `ASSETS_SCHEMA`, the `assets` block of the root runway: the root of the product's assets tree, when it is
 *          not `assets`.
 * Boundary: internal; the root runway schema composes it. `checkSurfaces` reads the root to refuse surface and mobile
 *           paths outside it.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decisions 1 and 3).
 */
import { z } from "zod";

import { ASSET_PATH_SCHEMA } from "#core/constants/asset-path-schema.constant";

/** `{ root: "assets" }`. */
export const ASSETS_SCHEMA = z.strictObject({ root: ASSET_PATH_SCHEMA });
