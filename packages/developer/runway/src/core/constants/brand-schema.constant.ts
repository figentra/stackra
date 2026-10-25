/**
 * Stackra file contract:
 * Purpose: `BRAND_SCHEMA`, one entry of an app member's `brands` list in `runway.yaml`: a per-brand build with its
 *          key, display name, brand tokens overlay path and the app id and store bundle ids it ships under.
 * Boundary: internal; the app runway schema and the runway facts schema compose it. Shape only: a complete identity
 *           and unique app ids across brands are gen checks (STA-340).
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decision 8: per-brand builds come from a `brands` list); ADR 0326 (app identity).
 */
import { z } from "zod";

/** One brand build of an app member. */
export const BRAND_SCHEMA = z.strictObject({
  key: z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a lower-case brand key"),
  name: z.string().min(1),
  tokens: z.string().min(1),
  appId: z.string().min(1),
  bundleIds: z
    .strictObject({ ios: z.string().min(1).optional(), android: z.string().min(1).optional() })
    .optional(),
});
