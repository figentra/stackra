/**
 * Stackra file contract:
 * Purpose: `ExtendableEvent`, a service-worker event whose work may outlive the listener: `waitUntil(promise)` keeps
 *          the worker alive until the promise settles. Every handler event below extends it.
 * Boundary: a structural type, so the `./sw` entry type-checks beside the DOM lib without the WebWorker lib; the
 *           browser's own events satisfy it.
 * Runtime: worker
 * Governing contract: ADR 0255.
 */

/** An event that can extend the worker's life. */
export interface ExtendableEvent {
  /** Keeps the worker alive until `promise` settles. */
  waitUntil: (promise: Promise<unknown>) => void;
}
