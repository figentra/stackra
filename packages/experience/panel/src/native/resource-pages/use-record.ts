/**
 * Stackra file contract:
 * Purpose: the native `useRecord(resource, id)`, one record of a resource read with its get query through the native
 *          `useQuery`, the id sent under the key the query's input names (`id`, `orderId`).
 * Boundary: internal to the native resource pages (View and Edit). Gen registers no resource screens on native yet, so
 *           no route hands an `:id`: the host's screen passes the id it holds in its own params.
 * Runtime: react-native
 * Governing contract: ADR 0307; ADR 0164 (native parity).
 */
import type { QueryRef } from "@stackra/clients";
import { useQuery } from "@stackra/clients/native";
import type { UseQueryResult } from "@stackra/clients/native";

import { recordIdKey } from "#core/functions/record-id-key.function";
import type { ResourceRoutes } from "#core/types/resource-routes.type";

/**
 * The record `id` of `resource` and the read of it.
 *
 * @throws TypeError when the resource has no get query or no id is given.
 * @example
 * const { id, answer } = useRecord(Resources.Order, route.params.id);
 */
export function useRecord(
  resource: ResourceRoutes,
  id: string | undefined,
): { readonly id: string; readonly answer: UseQueryResult<unknown> } {
  const get = resource.operations.view as QueryRef | undefined;
  if (get === undefined) throw new TypeError(`${resource.key} has no get query`);
  if (id === undefined) throw new TypeError(`${resource.key}: no record id given`);
  const key = recordIdKey(get.input, resource.key) ?? "id";
  return { id, answer: useQuery(get, { [key]: id } as never) };
}
