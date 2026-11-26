/**
 * Stackra file contract:
 * Purpose: `NewInboxFlag`, the example release switch of the "Settings and feature flags" guide: the rebuilt agent
 *          inbox, off by default, on for the tenants the flag provider targets, removed by its expiry date.
 * Boundary: the declaration only, as an app's `src/modules/support/access/new-inbox.flag.ts` would hold it; gen derives
 *           the key `support.new_inbox` and its label key. A flag is never a paid right: that is an entitlement.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 7: flags are not commercial rights); STA-2852.
 */
import { Flag } from "@stackra/feature-flags";

/** The rebuilt agent inbox; off until the rollout reaches a tenant. */
export class NewInboxFlag extends Flag({
  default: false,
  expires: "2027-03-31",
}) {}
