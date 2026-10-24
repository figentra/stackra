/**
 * Stackra file contract:
 * Purpose: `postToClients`, which posts one message to every open tab of the app, controlled or not.
 * Boundary: internal to `./sw`. No tab open is not an error: the message is dropped and the next start does the work.
 * Runtime: worker
 * Governing contract: ADR 0255.
 */
import type { ServiceWorkerScope } from "#sw/types/service-worker-scope.type";

/**
 * Posts `message` to every window client; resolves with how many received it.
 *
 * @example
 * await postToClients({ type: WORKER_MESSAGE.OutboxDrain });
 */
export async function postToClients(message: {
  readonly type: string;
  readonly [field: string]: unknown;
}): Promise<number> {
  const scope = globalThis as unknown as ServiceWorkerScope;
  const clients = await scope.clients.matchAll({ type: "window", includeUncontrolled: true });
  // oxlint-disable-next-line unicorn/require-post-message-target-origin -- reason: Client.postMessage takes no target origin
  for (const client of clients) client.postMessage(message);
  return clients.length;
}
