/**
 * Stackra file contract:
 * Purpose: `useRecord(resource, id)`, one record of a resource read with its get query, the id sent under the key the
 *          query's input names (`id`, `orderId`).
 * Boundary: internal to the resource pages (View and Edit). The id is the prop, else the route's `:id`.
 * Runtime: browser
 * Governing contract: ADR 0307; ADR 0164.
 */
import type { QueryRef } from "@stackra/clients";
import { useQuery } from "@stackra/clients/react";
import type { UseQueryResult } from "@stackra/clients/react";
import { useParams } from "react-router";

import { recordIdKey } from "#core/functions/record-id-key.function";
import type { ResourceRoutes } from "#core/types/resource-routes.type";

/**
 * The record `id` of `resource` and the read of it.
 *
 * @throws TypeError when the resource has no get query or no id is known.
 * @example
 * const { id, answer } = useRecord(Resources.Order);
 */
export function useRecord(
  resource: ResourceRoutes,
  given?: string,
): { readonly id: string; readonly answer: UseQueryResult<unknown> } {
  const params = useParams();
  const id = given ?? params["id"];
  const get = resource.operations.view as QueryRef | undefined;
  if (get === undefined) throw new TypeError(`${resource.key} has no get query`);
  if (id === undefined) throw new TypeError(`${resource.key}: no record id in the route`);
  const key = recordIdKey(get.input, resource.key) ?? "id";
  return { id, answer: useQuery(get, { [key]: id } as never) };
}
