/**
 * Stackra file contract:
 * Purpose: `DEFAULT_FLAG_SCOPES`, the scopes a flag may be set at when it names none: platform and tenant.
 * Boundary: a frozen list shared by `Flag({...})` and `flagRefs`, so a declared and a written-out flag default alike.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decision 25: `scopes` default to Platform and Tenant).
 */
import type { FlagScope } from "#core/types/flag-scope.type";

/** Platform and tenant. */
export const DEFAULT_FLAG_SCOPES: readonly FlagScope[] = Object.freeze(["platform", "tenant"]);
