/**
 * Stackra file contract:
 * Purpose: `StoreInternals`, the bookkeeping of one store instance kept outside it: where it persists, who listens, a
 *          version that changes on every change, the fields written so far and how far hydration got.
 * Boundary: a type only; held in `STORE_INTERNALS` by instance, so a store's own fields stay its state and nothing
 *           else (a spread of the instance is exactly its state).
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decision 2).
 */
import type { StoreStorageArea } from "#core/types/store-storage-area.type";

/** The hidden state of one store instance. */
export interface StoreInternals {
  /** The opened storage area; `undefined` for a session-only store or one built without storage. */
  readonly area: StoreStorageArea | undefined;

  /** The derived key the state is stored under; set whenever `area` is. */
  readonly key: string | undefined;

  /** Called after every change; `useStore` subscribes here. */
  readonly listeners: Set<() => void>;

  /** Fields `set` has written, which hydration never overwrites. */
  readonly written: Set<string>;

  /** Bumped on every change; the snapshot `useStore` compares. */
  version: number;

  /** `false` before hydration starts, the running promise while it runs, `true` once done. */
  hydration: boolean | Promise<void>;
}
