/**
 * Stackra file contract:
 * Purpose: `ShareTargetEvent`, the fetch event of the share target's POST: the request whose form carries the shared
 *          title, text, link and files.
 * Boundary: a structural type; the browser's `FetchEvent` satisfies it.
 * Runtime: worker
 * Governing contract: ADR 0255 (share target).
 */

/** The share target's request. */
export interface ShareTargetEvent {
  /**
   * The POST another app's share sheet sent; only its form is read. Typed by that one method, so the DOM form type
   * wins over React Native's global `FormData` in a program that loads both.
   */
  readonly request: { formData: () => Promise<FormData> };
}
