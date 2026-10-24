/**
 * Stackra file contract:
 * Purpose: `handlePush`, the service worker's `push` listener: shows the notification a Web Push carries and, when it
 *          carries an unread count, sets the app icon badge (`PwaConfig.push.badging`).
 * Boundary: a push carries a title and a route, not tenant content; the route rides on the notification's data for
 *           `handleNotificationClick`. A push without a JSON object with a string `title` shows nothing.
 * Runtime: worker
 * Governing contract: ADR 0255 (decision 3).
 */
import type { PushEvent } from "#sw/types/push-event.type";
import type { ServiceWorkerScope } from "#sw/types/service-worker-scope.type";

/** The fields a push may carry. */
interface PushPayload {
  readonly title?: unknown;
  readonly body?: unknown;
  readonly tag?: unknown;
  readonly route?: unknown;
  readonly badge?: unknown;
}

/** The payload as JSON, or undefined when it is not JSON. */
function payloadOf(event: PushEvent): PushPayload | undefined {
  try {
    const value = event.data?.json();
    return typeof value === "object" && value !== null ? (value as PushPayload) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Shows the push's notification and badge.
 *
 * @example
 * self.addEventListener("push", handlePush);
 */
export function handlePush(event: PushEvent): void {
  const payload = payloadOf(event);
  if (payload === undefined || typeof payload.title !== "string") return;
  const scope = globalThis as unknown as ServiceWorkerScope;
  const options: NotificationOptions = { data: { route: payload.route } };
  if (typeof payload.body === "string") options.body = payload.body;
  if (typeof payload.tag === "string") options.tag = payload.tag;
  const work: Promise<unknown>[] = [scope.registration.showNotification(payload.title, options)];
  const badging = globalThis.navigator as unknown as {
    setAppBadge?(count?: number): Promise<void>;
  };
  if (typeof payload.badge === "number" && badging.setAppBadge !== undefined)
    work.push(badging.setAppBadge(payload.badge));
  event.waitUntil(Promise.all(work));
}
