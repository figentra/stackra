/**
 * Stackra file contract:
 * Purpose: `Flags`, the stand-in for the typed flag references gen writes into `#stackra/flags` from every `*.flag.ts`:
 *          here `Flags.support.new_inbox` of the "Settings and feature flags" guide.
 * Boundary: data only; an app imports `Flags` from `#stackra/flags` and never writes this file.
 * Runtime: isomorphic
 * Governing contract: ADR 0213; ADR 0294 (decision 15: gen writes the registries); STA-2852.
 */
import { flagRefs } from "@stackra/feature-flags";

import { NewInboxFlag } from "./new-inbox.flag";

/** The guide's flag references. */
export const Flags = flagRefs({ support: { new_inbox: NewInboxFlag } });
