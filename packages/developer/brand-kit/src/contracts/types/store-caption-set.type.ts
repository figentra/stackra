/**
 * Stackra file contract:
 * Purpose: `StoreCaptionSet`, the captions of one app in one locale, with the screenshots the capture job left for
 *          them.
 * Boundary: a type in the leaf entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: D19).
 */
import type { StoreCaption } from "#contracts/types/store-caption.type";

/**
 * One app's captions in one locale.
 *
 * @example
 * const set: StoreCaptionSet = { app: "staff", locale: "en", captions: [], screenshots: new Map() };
 */
export interface StoreCaptionSet {
  /** The app folder under `assets/store`. */
  readonly app: string;

  /** The locale folder (BCP 47). */
  readonly locale: string;

  /** Captions in frame order. */
  readonly captions: readonly StoreCaption[];

  /** Captured PNG screenshots by screen id; a frame without one draws an empty screen. */
  readonly screenshots: ReadonlyMap<string, Uint8Array>;
}
