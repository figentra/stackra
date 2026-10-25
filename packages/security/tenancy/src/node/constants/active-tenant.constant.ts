/**
 * Stackra file contract:
 * Purpose: `ACTIVE_TENANT`, the tenant of the running `withTenant` call, which `BelongsToTenant` reads to fill a new
 *          row's `tenantId`.
 * Boundary: internal; an `AsyncLocalStorage` that only `TenantIsolationService.withTenant` enters, so the value follows
 *           the call through every await and never leaks into a concurrent one. A platform call enters it with
 *           `undefined`, so an outer tenant never reaches an inner call that has none.
 * Runtime: node
 * Governing contract: ADR 0210 (decision 3: one tenant context per request); ADR 0239; ADR 0294 (decision 27).
 */
import { AsyncLocalStorage } from "node:async_hooks";

import type { PublicId } from "@stackra/contracts";

/** The running call's tenant id. */
export const ACTIVE_TENANT = new AsyncLocalStorage<PublicId<"scp"> | undefined>();
