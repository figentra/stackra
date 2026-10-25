/**
 * Stackra file contract:
 * Purpose: `SharedPayload`, what another app's share sheet sent to the PWA share target: title, text, link and files,
 *          as the service worker kept them on the device.
 * Boundary: a type only. Device-local data: it is never cached as a response and never leaves the device until the
 *           user acts on it.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (share target); ADR 0250.
 */

/** One shared payload. */
export interface SharedPayload {
  /** The shared title, or null. */
  readonly title: string | null;

  /** The shared text, or null. */
  readonly text: string | null;

  /** The shared link, or null. */
  readonly url: string | null;

  /** The shared files, possibly none. */
  readonly files: readonly File[];
}
