/**
 * Stackra file contract:
 * Purpose: `webPushPayload(push)`, the JSON a Web Push carries to the service worker: the title, the body, the app's
 *          data and, when given, the action category and its buttons.
 * Boundary: pure; DevicePushTransportDriver encrypts the result. The service worker shows the buttons through the
 *           Notification API (`actions`) and opens the matching link when one is clicked.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); ADR 0533 (decision 4).
 */
import type { OutboundPush } from "#contracts/types/outbound-push.type";

/**
 * The payload of `push`.
 *
 * @example
 * const body = await encryptWebPush(webPushPayload(push), push.target);
 */
export function webPushPayload(push: OutboundPush): string {
  return JSON.stringify({
    title: push.title,
    body: push.body,
    data: push.data ?? {},
    ...(push.category === undefined ? {} : { category: push.category }),
    ...(push.actions === undefined || push.actions.length === 0 ? {} : { actions: push.actions }),
  });
}
