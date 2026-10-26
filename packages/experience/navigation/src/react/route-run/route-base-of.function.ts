/**
 * Stackra file contract:
 * Purpose: `routeBaseOf(args, keys)`, what every route context of one request shares, read from React Router's
 *          arguments and the request's context keys: the request and params, the container, the member's env, a caller
 *          over the request's public clients, and the error reporter.
 * Boundary: internal to `./react`; reads only, never throws. Without keys nothing but the request and params is set.
 * Runtime: isomorphic
 * Governing contract: ADR 0297 (web runtime); ADR 0260 (decision 4).
 */
import type { PublicClients } from "@stackra/clients/server";
import { ErrorReporter } from "@stackra/errors/contracts";

import type { RouteCaller } from "#contracts/index";
import { readRouteKey } from "#react/route-keys/read-route-key.function";
import type { RouteKeys } from "#react/route-keys/route-keys.type";
import type { RouterArgs } from "#react/route-run/router-args.type";
import type { RouteRun } from "#react/route-run/route-run.type";

/**
 * The shared inputs of one request, with its public clients and reporter.
 *
 * @example
 * const { base, clients } = routeBaseOf(args, routeKeys);
 */
export function routeBaseOf(
  args: RouterArgs,
  keys: RouteKeys | null,
): Pick<RouteRun, "base" | "container" | "reporter"> & {
  readonly clients: () => Pick<PublicClients, "query" | "action">;
} {
  const container = readRouteKey(args.context, keys?.container);
  const env = readRouteKey(args.context, keys?.env);
  const factory = readRouteKey(args.context, keys?.clients);
  const reporter =
    readRouteKey(args.context, keys?.reporter) ??
    (container?.has(ErrorReporter) === true ? container.get(ErrorReporter) : undefined);
  let made: Pick<PublicClients, "query" | "action"> | undefined;
  const clients = (): Pick<PublicClients, "query" | "action"> => {
    if (factory === undefined)
      throw new TypeError("The request carries no public clients (the clients context key)");
    return (made ??= (factory as () => Pick<PublicClients, "query" | "action">)());
  };
  const caller: Pick<RouteCaller, "query" | "action"> | undefined =
    factory === undefined
      ? undefined
      : {
          query: (query, input, options) =>
            clients().query(query, input, { signal: options?.signal ?? args.request.signal }),
          action: async (action, input, options) => ({
            queued: false,
            data: await clients().action(action, input, {
              signal: options?.signal ?? args.request.signal,
            }),
          }),
        };
  return {
    base: {
      request: args.request,
      params: args.params,
      container,
      caller,
      members: env === undefined ? undefined : { env },
    },
    container,
    reporter,
    clients,
  };
}
