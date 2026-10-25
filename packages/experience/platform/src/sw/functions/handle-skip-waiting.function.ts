/**
 * Stackra file contract:
 * Purpose: `handleSkipWaiting`, the service worker's `message` listener for updates (`PwaConfig.updates.strategy:
 *          prompt`): when a page posts `{ type: "skip_waiting" }` after the user accepted the update, the waiting
 *          worker activates; the page reloads once it takes control.
 * Boundary: any other message is left to other listeners.
 * Runtime: worker
 * Governing contract: ADR 0255.
 */
import { WORKER_MESSAGE } from "#sw/constants/worker-message.constant";
import type { ServiceWorkerScope } from "#sw/types/service-worker-scope.type";
import type { WorkerMessageEvent } from "#sw/types/worker-message-event.type";

/**
 * Activates the waiting worker on request.
 *
 * @example
 * self.addEventListener("message", handleSkipWaiting);
 */
export function handleSkipWaiting(event: WorkerMessageEvent): void {
  if ((event.data as { type?: unknown } | null)?.type !== WORKER_MESSAGE.SkipWaiting) return;
  event.waitUntil((globalThis as unknown as ServiceWorkerScope).skipWaiting());
}
