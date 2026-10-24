/**
 * Stackra file contract:
 * Purpose: `handleBackgroundSync`, the service worker's `sync` listener: when the outbox's Background Sync fires
 *          (`PwaConfig.offline.backgroundSync`), it asks the open tabs to drain the outbox, which replays the queued
 *          writes with their idempotency keys.
 * Boundary: the worker holds no tenant data and calls no API: the drain runs in the page, which owns the encrypted
 *           outbox (ADR 0252). Other tags are left to other listeners.
 * Runtime: worker
 * Governing contract: ADR 0255 (decision 4); ADR 0252 (the outbox).
 */
import { OUTBOX_SYNC_TAG } from "#sw/constants/outbox-sync-tag.constant";
import { WORKER_MESSAGE } from "#sw/constants/worker-message.constant";
import { postToClients } from "#sw/functions/post-to-clients.function";
import type { SyncEvent } from "#sw/types/sync-event.type";

/**
 * Wakes the outbox drain.
 *
 * @example
 * self.addEventListener("sync", handleBackgroundSync);
 */
export function handleBackgroundSync(event: SyncEvent): void {
  if (event.tag !== OUTBOX_SYNC_TAG) return;
  event.waitUntil(postToClients({ type: WORKER_MESSAGE.OutboxDrain }));
}
