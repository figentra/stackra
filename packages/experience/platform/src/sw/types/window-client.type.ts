/**
 * Stackra file contract:
 * Purpose: `WindowClient`, the slice of a service worker's window client the handlers use: its URL, focusing it,
 *          navigating it and posting it a message.
 * Boundary: a structural type, so the `./sw` entry type-checks beside the DOM lib without the WebWorker lib; the
 *           browser's own `WindowClient` satisfies it.
 * Runtime: worker
 * Governing contract: ADR 0255 (decision 2).
 */

/** An open tab of the app, seen from its service worker. */
export interface WindowClient {
  /** The tab's URL. */
  readonly url: string;

  /** Brings the tab to the front. */
  focus: () => Promise<unknown>;

  /** Navigates the tab to `url`. */
  navigate: (url: string) => Promise<unknown>;

  /** Posts `message` to the page. */
  postMessage: (message: unknown) => void;
}
