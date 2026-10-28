/**
 * Stackra file contract:
 * Purpose: `urlBase64ToBytes`, which decodes a Web Push (VAPID) public key, written URL-safe base64 without padding,
 *          into the bytes `pushManager.subscribe` takes as `applicationServerKey`.
 * Boundary: internal; not exported from the entry. Pure.
 * Runtime: browser
 * Governing contract: ADR 0255 (decision 3: Web Push).
 */

/**
 * The bytes of `value`.
 *
 * @throws DOMException when `value` is not base64.
 * @example
 * urlBase64ToBytes("BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U");
 */
export function urlBase64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`;
  const binary = atob(padded.replaceAll("-", "+").replaceAll("_", "/"));
  // oxlint-disable-next-line unicorn/prefer-code-point -- a binary string: every character is one byte, so the code unit is the byte
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
