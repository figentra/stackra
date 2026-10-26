/**
 * Stackra file contract:
 * Purpose: `ASSET_PATH_SCHEMA`, a repository-relative path into the product's assets tree (`assets/store/staff`):
 *          segments of letters, digits, `.`, `_` and `-`, none starting with a dot, so no absolute path, `..` or
 *          hidden folder passes.
 * Boundary: internal; the surface, mobile app and assets schemas compose it. That the path sits under the assets
 *           root is `checkSurfaces`'s (the root is itself runway data).
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decisions 1 and 3, enforcement: paths outside `assets/` are refused).
 */
import { z } from "zod";

/** `assets/mobile/staff`. */
export const ASSET_PATH_SCHEMA = z
  .string()
  .regex(
    /^[A-Za-z0-9_-][A-Za-z0-9._-]*(\/[A-Za-z0-9_-][A-Za-z0-9._-]*)*$/,
    "Expected a relative path without .. or a leading dot, such as assets/landing",
  );
