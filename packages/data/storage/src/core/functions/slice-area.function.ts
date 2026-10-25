/**
 * Stackra file contract:
 * Purpose: `sliceArea(area, dimension, value)`, the view of a storage area that holds only the replica rows of one
 *          value of a tenant dimension (`legalEntityId`), so a device keeps only its own legal entity's records and
 *          personal data never crosses a border inside a multi-country tenant.
 * Boundary: keys are stored as `slice:<dimension>=<value>:<key>`. Opening a slice removes every row the area holds
 *           under the same dimension with another value, so a device moved to another legal entity keeps nothing of
 *           the one it left. Which dimension a replica is scoped by is the module's `replica: { scope }` declaration,
 *           and the device's value comes from its session; nothing here chooses either. Payload sealing still applies
 *           to the area underneath.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3); ADR 0343 (decision 4: the legal entity is the transfer boundary).
 */
import type { StorageAreaHandle } from "#contracts/types/storage-area-handle.type";
import type { ReplicaSlice } from "#core/types/replica-slice.type";

/** A camelCase dimension field. */
const DIMENSION = /^[a-z][a-zA-Z0-9]{0,62}$/;

/**
 * The slice of `area` for `dimension` = `value`.
 *
 * @throws TypeError when `dimension` is not a camelCase field name or `value` is empty or holds `:`.
 * @example
 * const sales = sliceArea(storage.cache, "legalEntityId", session.legalEntityId);
 * sales.set("sales.sale.sal_01", row);
 */
export function sliceArea(area: StorageAreaHandle, dimension: string, value: string): ReplicaSlice {
  if (!DIMENSION.test(dimension))
    throw new TypeError(`"${dimension}" is not a camelCase dimension field`);
  if (value === "" || value.includes(":"))
    throw new TypeError(`"${value}" is not a ${dimension} value`);
  const family = `slice:${dimension}=`;
  const prefix = `${family}${value}:`;
  for (const key of area.keys())
    if (key.startsWith(family) && !key.startsWith(prefix)) area.delete(key);
  const own = (): string[] => area.keys().filter((key) => key.startsWith(prefix));
  return {
    get: (key) => area.get(prefix + key),
    set: (key, stored, options) => area.set(prefix + key, stored, options),
    has: (key) => area.has(prefix + key),
    delete: (key) => area.delete(prefix + key),
    keys: () => own().map((key) => key.slice(prefix.length)),
    clear: () => {
      for (const key of own()) area.delete(key);
    },
  };
}
