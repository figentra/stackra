/**
 * Stackra file contract:
 * Purpose: `WORKER_MESSAGE`, the `type` codes of the messages between the app's pages and its service worker: the
 *          worker asks the pages to drain the outbox or to re-register a rotated push subscription; a page asks a
 *          waiting worker to take over.
 * Boundary: internal data of `./sw`; the page side (the query outbox, the push context, the update prompt) uses the
 *           same codes. A new message adds its code here.
 * Runtime: worker
 * Governing contract: ADR 0255; ADR 0252 (the outbox).
 */

/** Message `type` codes. */
export const WORKER_MESSAGE = Object.freeze({
  /** Worker to pages: Background Sync fired; drain the outbox now. */
  OutboxDrain: "outbox_drain",
  /** Worker to pages: the push subscription changed; register `subscription` again. */
  PushSubscriptionChanged: "push_subscription_changed",
  /** Page to worker: the user accepted the update; activate now. */
  SkipWaiting: "skip_waiting",
} as const);
