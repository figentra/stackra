/**
 * Stackra file contract:
 * Purpose: `shownText`, the text a pass shows for a label or value: its entry in the request's `labels`, else the
 *          string as written.
 * Boundary: internal to the pass folder; pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5).
 */
import type { WalletPassRequest } from "#node/pass/wallet-pass-request.type";

/**
 * `text` as shown.
 *
 * @example
 * shownText({ labels: { "a::b": "Points" } } as WalletPassRequest, "a::b"); // "Points"
 */
export function shownText(request: Pick<WalletPassRequest, "labels">, text: string): string {
  return request.labels?.[text] ?? text;
}
