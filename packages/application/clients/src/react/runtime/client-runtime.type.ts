/**
 * Stackra file contract:
 * Purpose: `ClientRuntime`, what the client hooks read from the container: the transport, the server-state cache, and
 *          the mutation queue and session when the host binds them.
 * Boundary: a type internal to the `./react` entry; not exported.
 * Runtime: browser, react-native
 * Governing contract: ADR 0260 (decision 6); ADR 0079 (TanStack Query core).
 */
import type { ServerStateCache, MutationQueue } from "@stackra/query";

import type { ClientSession } from "#contracts/ports/client-session.port";
import type { ClientTransport } from "#contracts/ports/client-transport.port";

/** The services the hooks use. */
export interface ClientRuntime {
  /** Sends the calls. */
  readonly transport: ClientTransport;

  /** The TanStack client and the live-query watches. */
  readonly cache: ServerStateCache;

  /** Holds offline calls; absent when the host binds no queue. */
  readonly queue?: MutationQueue;

  /** Says which permissions the session holds; absent when the host binds no session. */
  readonly session?: ClientSession;
}
