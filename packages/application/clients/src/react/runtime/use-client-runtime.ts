/**
 * Stackra file contract:
 * Purpose: `useClientRuntime`, the transport, cache, queue and session of the container above, resolved once per
 *          container for the client hooks.
 * Boundary: internal to the `./react` entry; not exported. The transport and the cache are required; the queue and the
 *           session are optional, so a host without offline writes or without a session still renders.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 6); ADR 0263 (gen writes the wiring).
 */
import { useContainer } from "@stackra/container/react";
import { MutationQueue, ServerStateCache } from "@stackra/query";
import { useMemo } from "react";

import { ClientSession } from "#contracts/ports/client-session.port";
import { ClientTransport } from "#contracts/ports/client-transport.port";
import type { ClientRuntime } from "#react/runtime/client-runtime.type";

/**
 * The client runtime of the container above.
 *
 * @throws Error outside a `ContainerProvider`, or when the container binds no `ClientTransport` or `ServerStateCache`.
 */
export function useClientRuntime(): ClientRuntime {
  const container = useContainer();
  return useMemo(
    () => ({
      transport: container.get(ClientTransport),
      cache: container.get(ServerStateCache),
      ...(container.has(MutationQueue) ? { queue: container.get(MutationQueue) } : {}),
      ...(container.has(ClientSession) ? { session: container.get(ClientSession) } : {}),
    }),
    [container],
  );
}
