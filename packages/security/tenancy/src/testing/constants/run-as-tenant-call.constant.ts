/**
 * Stackra file contract:
 * Purpose: `RUN_AS_TENANT_CALL`, the tenant of the running `runAsTenant` call, which `RunAsTenantSubscriber` reads to
 *          check a new `BelongsToTenant` row at flush.
 * Boundary: internal to `./testing`; an `AsyncLocalStorage` only `runAsTenant` enters, beside `ACTIVE_TENANT`.
 *           `ACTIVE_TENANT` is also entered by production's `withTenant`, so this second store is what marks a call as
 *           the test helper's: outside `runAsTenant` it holds nothing and no row is checked.
 * Runtime: node
 * Governing contract: ADR 0269 (testing entries); ADR 0239.
 */
import { AsyncLocalStorage } from "node:async_hooks";

import type { PublicId } from "@stackra/contracts";

/** The running `runAsTenant` call's tenant id. */
export const RUN_AS_TENANT_CALL = new AsyncLocalStorage<PublicId<"scp"> | undefined>();
