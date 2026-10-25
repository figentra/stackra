/**
 * Stackra file contract:
 * Purpose: `verifyQr`, an award's verify URL as a QR code: an SVG document a certificate template or a screen embeds.
 * Boundary: isomorphic, through `uqr` (pure TypeScript, no canvas). It encodes the URL it is given and nothing else;
 *           the URL's origin and path are the consumer's setting.
 * Runtime: isomorphic
 * Governing contract: ADR 0368 (decision 5); OS ADR 0058 (decision 1: a QR code).
 */
import { renderSVG } from "uqr";

/**
 * The QR code of `url`, as SVG.
 *
 * @example
 * const svg = verifyQr("https://verify.example.com/awards/9fJk…");
 */
export function verifyQr(url: string): string {
  return renderSVG(url);
}
