/**
 * Stackra file contract:
 * Purpose: `handlePushSubscriptionChange`, the service worker's `pushsubscriptionchange` listener: subscribes again
 *          with the old subscription's options and tells the open tabs, whose push context registers the new
 *          subscription with the devices module.
 * Boundary: the worker calls no API itself; with no tab open, the next start's registration picks the new
 *           subscription up. A browser that does not name the old subscription is left to that next start too.
 * Runtime: worker
 * Governing contract: ADR 0255 (decision 3); ADR 0235 (devices).
 */
import { WORKER_MESSAGE } from "#sw/constants/worker-message.constant";
import { postToClients } from "#sw/functions/post-to-clients.function";
import type { PushSubscriptionChangeEvent } from "#sw/types/push-subscription-change-event.type";
import type { ServiceWorkerScope } from "#sw/types/service-worker-scope.type";

/**
 * Renews a rotated push subscription.
 *
 * @example
 * self.addEventListener("pushsubscriptionchange", handlePushSubscriptionChange);
 */
export function handlePushSubscriptionChange(event: PushSubscriptionChangeEvent): void {
  const options = event.oldSubscription?.options;
  if (options === undefined) return;
  const scope = globalThis as unknown as ServiceWorkerScope;
  event.waitUntil(
    (async () => {
      const subscription = await scope.registration.pushManager.subscribe({
        userVisibleOnly: options.userVisibleOnly,
        applicationServerKey: options.applicationServerKey,
      });
      await postToClients({
        type: WORKER_MESSAGE.PushSubscriptionChanged,
        subscription: JSON.stringify(subscription),
      });
    })(),
  );
}
