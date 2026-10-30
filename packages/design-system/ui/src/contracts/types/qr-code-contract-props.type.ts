/**
 * Stackra file contract:
 * Purpose: `QrCodeContractProps`, the props every runtime's `QrCode` takes: a text or link drawn as a QR code.
 * Boundary: types only; the code is always dark on a light tile, the contrast scanners need, in light and dark themes.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */

/** Props shared by the web and native `QrCode`. */
export interface QrCodeContractProps {
  /** The text or link to encode. */
  readonly value: string;
  /** What the code opens, for people who cannot scan it, for example "Pay invoice INV-2207". */
  readonly label: string;
  /** The side in pixels; defaults to 160. */
  readonly size?: number | undefined;
  /** Error correction: `L`, `M` (the default), `Q` or `H` (survives a logo or damage). */
  readonly level?: "L" | "M" | "Q" | "H" | undefined;
}
