/**
 * Stackra file contract:
 * Purpose: `NativeWriteWatcher`, what @stackra/outbox's flush writer implements so the `CrudService` verbs that write
 *          with a native statement (no flush, so no `onFlush`) still reach the change feed.
 * Boundary: a type only; one watcher per process, named by `connectNativeWriteWatcher`. `watches` is asked first, so
 *           a model nobody watches pays nothing: only a watched model's verb reads the matching ids before its
 *           statement and reports them after it. Raw SQL the caller writes itself is never seen.
 * Runtime: node
 * Governing contract: data-layer gap mo10; ADR 0078 (decision 4: written in the same transaction).
 */
import type { AnyClass } from "@stackra/container";

import type { NativeWrite } from "#core/types/native-write.type";

/** Is told of native writes. */
export interface NativeWriteWatcher {
  /** Whether native writes of `model` are reported. */
  watches: (model: AnyClass) => boolean;

  /** Records one native write, inside its transaction; a throw fails the caller's write. */
  written: (write: NativeWrite) => Promise<void>;
}
