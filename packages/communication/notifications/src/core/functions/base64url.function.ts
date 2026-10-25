/**
 * Stackra file contract:
 * Purpose: `base64url`, unpadded base64url encoding of bytes and its reverse (`base64url.decode`), for VAPID keys, JWTs
 *          and Web Push subscription keys.
 * Boundary: pure; `btoa` and `atob` only.
 * Runtime: isomorphic
 * Governing contract: RFC 4648 (section 5); RFC 8292.
 */

/** Bytes of a base64url (or base64) string. */
function decode(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(
    text
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(text.length / 4) * 4, "="),
  );
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/**
 * The unpadded base64url of `bytes`.
 *
 * @example
 * base64url(new Uint8Array([251, 255])); // "-_8"
 * base64url.decode("-_8"); // Uint8Array [251, 255]
 */
export const base64url = Object.assign(
  (bytes: Uint8Array | ArrayBuffer): string =>
    btoa(String.fromCharCode(...new Uint8Array(bytes)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, ""),
  { decode },
);
