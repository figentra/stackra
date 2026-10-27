/**
 * Stackra file contract:
 * Purpose: `base64url`, unpadded URL-safe Base64 (RFC 4648 section 5) of bytes, for the parts of a signed token, the
 *          digest of a one-time code record, VAPID keys, JWT segments and Web Push subscription keys.
 * Boundary: public (the one base64url of Stackra; stackra-224 moved the notifications copy here). Written out instead
 *           of `btoa`/`atob` or `Buffer`, so it runs the same in Node, browsers, workers and React Native. `decode`
 *           accepts trailing `=` padding (some browsers pad Web Push keys) and refuses anything else outside the
 *           alphabet.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); RFC 4648; RFC 8292.
 */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/**
 * Unpadded base64url encode and decode.
 *
 * @example
 * base64url.encode(new Uint8Array([251, 255])); // "-_8"
 * base64url.decode("-_8"); // Uint8Array [251, 255]
 */
export const base64url = Object.freeze({
  /** The unpadded base64url text of `input` (bytes, or a buffer Web Crypto returned). */
  encode(input: Uint8Array | ArrayBuffer): string {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    let out = "";
    for (let i = 0; i < bytes.length; i += 3) {
      const chunk = ((bytes[i] ?? 0) << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
      const chars = Math.min(4, Math.ceil(((bytes.length - i) * 8) / 6));
      for (let c = 0; c < chars; c++) out += ALPHABET[(chunk >> (18 - 6 * c)) & 63];
    }
    return out;
  },

  /**
   * The bytes of a base64url text, padded or not.
   *
   * @throws RangeError when `text` holds a character outside the alphabet or has an impossible length.
   */
  decode(padded: string): Uint8Array<ArrayBuffer> {
    const text = padded.replace(/={1,2}$/, "");
    if (text.length % 4 === 1) throw new RangeError("base64url: impossible length");
    const out = new Uint8Array(Math.floor((text.length * 6) / 8));
    let bits = 0;
    let value = 0;
    let at = 0;
    for (const char of text) {
      const index = ALPHABET.indexOf(char);
      if (index < 0) throw new RangeError("base64url: character outside the alphabet");
      value = (value << 6) | index;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        out[at++] = (value >> bits) & 255;
      }
    }
    return out;
  },
});
