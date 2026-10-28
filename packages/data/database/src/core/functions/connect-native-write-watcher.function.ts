/**
 * Stackra file contract:
 * Purpose: `connectNativeWriteWatcher`, which names the watcher the native `CrudService` verbs report their rows to;
 *          the runtime calls it once at boot with @stackra/outbox's `OutboxWriterService`.
 * Boundary: replaces the previous watcher whole; `undefined` disconnects.
 * Runtime: node
 * Governing contract: data-layer gap mo10; the `connectHoldRegistry` precedent.
 */
import { NATIVE_WRITE_HOST } from "#core/constants/native-write-host.constant";
import type { NativeWriteWatcher } from "#core/types/native-write-watcher.type";

/**
 * Connects the native writes to their watcher.
 *
 * @param watcher - the outbox writer, or `undefined` to disconnect.
 * @example
 * connectNativeWriteWatcher(container.get(OutboxWriterService));
 */
export function connectNativeWriteWatcher(watcher: NativeWriteWatcher | undefined): void {
  NATIVE_WRITE_HOST.watcher = watcher;
}
