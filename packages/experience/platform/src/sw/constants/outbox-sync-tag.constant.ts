/**
 * Stackra file contract:
 * Purpose: `OUTBOX_SYNC_TAG`, the Background Sync tag a page registers when a write is queued offline; its sync event
 *          wakes the outbox drain (`PwaConfig.offline.backgroundSync`).
 * Boundary: internal data of `./sw`; the page side registers the same tag.
 * Runtime: worker
 * Governing contract: ADR 0255 (decision 4); ADR 0252.
 */

/** The outbox's Background Sync tag. */
export const OUTBOX_SYNC_TAG = "stackra_outbox";
