/**
 * Stackra file contract:
 * Purpose: the `IncomingShare` port: what other apps shared into this one through the iOS share extension or the
 *          Android share target (photos, PDFs, links and text), the bytes of a shared file, and forgetting them once
 *          the app has handled them.
 * Boundary: an abstract class that is its own token, keyed `native_share.IncomingShare`; a driver per target
 *           implements it (memory, Expo). `pending` returns only what `NativeShareConfig` accepts, and `read` refuses
 *           with `null`, never an exception, so app code needs no platform checks.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 5 and 9); ADR 0255 (share target); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { SharedItem } from "#contracts/types/shared-item.type";

/**
 * The share inbox of a native app.
 *
 * @example
 * const share = useContainer().get(IncomingShare);
 * for (const item of await share.pending()) if (item.kind === "file") await uploader.upload(await share.read(item), null);
 * await share.clear();
 */
export abstract class IncomingShare extends Port {
  /** Type-only port key, so `DriverName<IncomingShare>` narrows to this port's drivers. */
  declare readonly "~key": "native_share.IncomingShare";

  /** The shared items not yet cleared, limited to what the configuration accepts. */
  abstract pending(): Promise<readonly SharedItem[]>;

  /** The bytes of a shared file; `null` for a text or a link, a file that is gone, or one over `maxBytes`. */
  abstract read(item: SharedItem): Promise<Blob | null>;

  /** Forgets every shared item once the app has handled them. */
  abstract clear(): Promise<void>;

  /** Calls `listener` whenever a new share may have arrived; returns the unsubscribe function. */
  abstract subscribe(listener: () => void): () => void;
}
