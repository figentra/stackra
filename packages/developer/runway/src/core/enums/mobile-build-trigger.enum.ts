/**
 * Stackra file contract:
 * Purpose: `MobileBuildTrigger`, what starts a mobile build job: a merge to the product's main branch (every app its
 *          root runway declares) or an OS tenant event (one white-label app built from tenant data).
 * Boundary: an `Enum.of` value plus the type of the same name.
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decisions 2 and 8).
 */
import { Enum } from "@stackra/contracts";

/** One case per trigger. */
export const MobileBuildTrigger = Enum.of({
  /** A merge to the product's main branch: every `mobile` entry of the root runway. */
  ProductMerge: "product-merge",
  /** An OS tenant event: one white-label app, its entry built from tenant data. */
  TenantEvent: "tenant-event",
});

/** One of the codes above. */
export type MobileBuildTrigger = Enum.Value<typeof MobileBuildTrigger>;
