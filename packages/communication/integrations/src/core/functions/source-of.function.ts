/**
 * Stackra file contract:
 * Purpose: `sourceOf`, the `source` and `resourceId` a store records for a new connection: what the caller said, with a
 *          managed resource refused on a bring-your-own connection.
 * Boundary: internal; both stores call it while drafting the record. A mistake here is the caller's wiring, so it throws
 *           a `TypeError`, never a refusal.
 * Runtime: isomorphic
 * Governing contract: R3-SO-03 (a managed Connection holds the platform key and a tenant resource id).
 */
import { ProviderSource } from "#contracts/enums/provider-source.enum";
import type { Connection } from "#core/bases/connection.base";
import type { ConnectInput } from "#core/types/connect-input.type";
import type { ConnectionRecord } from "#core/types/connection-record.type";

/**
 * The record's source fields.
 *
 * @throws TypeError when a `resourceId` comes with a source other than `managed`.
 * @example
 * const draft = { id, level, ...owner, ...splitFields(type, input.fields), ...sourceOf(input) };
 */
export function sourceOf<C extends Connection>(
  input: ConnectInput<C>,
): Pick<ConnectionRecord, "source" | "resourceId"> {
  if (input.resourceId !== undefined && input.source !== ProviderSource.Managed)
    throw new TypeError("A managed resource id needs source: ProviderSource.Managed");
  return {
    ...(input.source === undefined ? {} : { source: input.source }),
    ...(input.resourceId === undefined ? {} : { resourceId: input.resourceId }),
  };
}
