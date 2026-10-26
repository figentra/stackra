/**
 * Stackra file contract:
 * Purpose: `derToP1363`, an ECDSA signature in DER (`SEQUENCE { INTEGER r, INTEGER s }`, what AWS KMS returns) as the
 *          fixed-width `r || s` form Web Crypto verifies.
 * Boundary: internal to the package; pure. Short-form lengths only (every P-256 signature fits). Refuses anything else
 *           with a RangeError that names no byte.
 * Runtime: isomorphic
 * Governing contract: ADR 0416; RFC 3279 section 2.2.3; IEEE P1363.
 */

/** Throws the refusal for a malformed DER signature. */
const fail = (): never => {
  throw new RangeError("The signature is not a DER ECDSA signature");
};

/**
 * The `r || s` form of `der`, each integer `size` bytes.
 *
 * @example
 * derToP1363(kmsSignature, 32); // 64 bytes
 */
export function derToP1363(der: Uint8Array, size: number): Uint8Array<ArrayBuffer> {
  if (der[0] !== 0x30 || der[1] !== der.length - 2) fail();
  const out = new Uint8Array(size * 2);
  let at = 2;
  for (const half of [0, 1]) {
    if (der[at] !== 0x02) fail();
    const length = der[at + 1] ?? fail();
    let bytes = der.subarray(at + 2, at + 2 + length);
    if (bytes.length !== length) fail();
    // A positive DER integer may carry a leading zero byte; drop it and any other leading zeros.
    while (bytes.length > 0 && bytes[0] === 0) bytes = bytes.subarray(1);
    if (bytes.length > size) fail();
    out.set(bytes, half * size + size - bytes.length);
    at += 2 + length;
  }
  if (at !== der.length) fail();
  return out;
}
