/**
 * Stackra file contract:
 * Purpose: `registerReplicas(refs)`, records the consumed queries declared replicas, so `ReplicaStore` keeps them and
 *          `useReplica` reads them; `@stackra/clients`' `queryRef` calls it for a ref with a `replica`.
 * Boundary: checks what the store relies on (a readable `window`, a positive integer `limit`) and refuses the rest when
 *           the generated module loads, never at a refresh; nothing is recorded when one ref is refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3 and its gen check: a replica without `window` and `limit` fails); ADR 0294
 *                     (decision 17).
 */
import { duration } from "@stackra/validation";

import { REPLICAS } from "#core/constants/replicas.constant";
import type { ReplicaRef } from "#core/types/replica-ref.type";

/**
 * Records `refs` as replicas.
 *
 * @throws RangeError when a ref's `window` is not a duration (`"30d"`) or its `limit` is not a positive integer.
 * @example
 * registerReplicas([RecentSalesQuery]); // static replica = { of: "sales.sale", window: "30d", limit: 5000 }
 */
export function registerReplicas(refs: readonly ReplicaRef[]): void {
  for (const ref of refs) {
    duration(ref.replica.window);
    if (!Number.isSafeInteger(ref.replica.limit) || ref.replica.limit <= 0)
      throw new RangeError(`The replica ${ref.key} needs a positive integer limit`);
  }
  for (const ref of refs) REPLICAS.set(ref.key, ref);
}
