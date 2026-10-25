/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./sw` entry of @stackra/platform, the six handlers the generated `sw.ts` registers
 *          (Background Sync, push, subscription change, notification click, share target, skip waiting), until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Runs in the service worker only; the handlers type their
 *           events structurally, so the worker program checks them against the WebWorker lib's real events.
 * Runtime: worker
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./sw` entry); ADR 0255; the STA-347 stand-in
 *                     barrel decision.
 */
export { handleBackgroundSync } from "#sw/functions/handle-background-sync.function";
export { handleNotificationClick } from "#sw/functions/handle-notification-click.function";
export { handlePush } from "#sw/functions/handle-push.function";
export { handlePushSubscriptionChange } from "#sw/functions/handle-push-subscription-change.function";
export { handleShareTarget } from "#sw/functions/handle-share-target.function";
export { handleSkipWaiting } from "#sw/functions/handle-skip-waiting.function";
export type { ShareTargetOptions } from "#sw/types/share-target-options.type";
