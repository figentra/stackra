/**
 * Stackra file contract:
 * Purpose: `WHITE_LABEL_SCHEMA`, the per-tenant build variants of a mobile app: the entitlement that turns them on
 *          for a tenant and the publishing modes offered (`managed` under the platform's store account,
 *          `bring-your-own` under the tenant's connected one).
 * Boundary: internal; the root `mobile` and the app runway `release.mobile` compose it. Shape only: the build is the
 *           tenant-started mobile job's, started by an OS event, never by a repository change.
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (tenant-started builds), app-shells D14 (managed or bring-your-own); the Commerce gap
 *                     row "runway app schema has no per-tenant build variants".
 */
import { z } from "zod";

/** `{ entitlement: "entitlement:academorix:white-label", modes: ["managed", "bring-your-own"] }`. */
export const WHITE_LABEL_SCHEMA = z.strictObject({
  entitlement: z.string().min(1).optional(),
  modes: z.array(z.enum(["managed", "bring-your-own"])).optional(),
});
