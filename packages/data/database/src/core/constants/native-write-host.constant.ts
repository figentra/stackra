/**
 * Stackra file contract:
 * Purpose: `NATIVE_WRITE_HOST`, the `NativeWriteWatcher` the native `CrudService` verbs report to, since a
 *          `CrudService` subclass calls `super()` with no arguments.
 * Boundary: internal; written only by `connectNativeWriteWatcher`. Unset, native writes are reported to nobody.
 * Runtime: node
 * Governing contract: data-layer gap mo10; the `HOLD_HOST` precedent.
 */
import type { NativeWriteWatcher } from "#core/types/native-write-watcher.type";

/** The connected watcher, or undefined before `connectNativeWriteWatcher`. */
export const NATIVE_WRITE_HOST: { watcher: NativeWriteWatcher | undefined } = {
  watcher: undefined,
};
