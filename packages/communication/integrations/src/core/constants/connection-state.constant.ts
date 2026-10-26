/**
 * Stackra file contract:
 * Purpose: `CONNECTION_STATE`, what a loaded Connection carries beside its fields: its id and its managed client.
 * Boundary: internal; written by `hydrateConnection` (a store, `makeConnection`), read by the Connection base's `id`
 *           and `api`. Kept beside the instance, so the client never serialises with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2 and 13).
 */
import type { PublicId } from "@stackra/contracts";

import type { ProviderSource } from "#contracts/enums/provider-source.enum";
import type { IntegrationApi } from "#core/types/integration-api.type";

/** Connection instance to its id, its source, its managed resource and its client. */
export const CONNECTION_STATE = new WeakMap<
  object,
  {
    readonly id: PublicId<"conn">;
    readonly source?: ProviderSource;
    readonly resourceId?: string;
    api?: IntegrationApi;
  }
>();
