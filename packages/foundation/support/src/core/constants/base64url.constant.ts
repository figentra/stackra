/**
 * Stackra file contract:
 * Purpose: `base64url`, unpadded URL-safe Base64 (RFC 4648 section 5) of bytes, for the parts of a signed token and the
 *          digest of a one-time code record.
 * Boundary: internal to @stackra/support (not re-exported). Written out instead of `btoa`/`atob` or `Buffer`, so it
 *           runs the same in Node, browsers, workers and React Native.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); RFC 4648.
 */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** Unpadded base64url encode and decode. */
export const base64url = Object.freeze({
  /** The unpadded base64url text of `bytes`. */
  encode(bytes: Uint8Array): string {
    let out = "";
    for (let i = 0; i < bytes.length; i += 3) {
      const chunk = ((bytes[i] ?? 0) << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
      const chars = Math.min(4, Math.ceil(((bytes.length - i) * 8) / 6));
      for (let c = 0; c < chars; c++) out += ALPHABET[(chunk >> (18 - 6 * c)) & 63];
    }
    return out;
  },

  /**
   * The bytes of an unpadded base64url text.
   *
   * @throws RangeError when `text` holds a character outside the alphabet or has an impossible length.
   */
  decode(text: string): Uint8Array {
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
