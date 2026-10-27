/**
 * Stackra file contract:
 * Purpose: `p1363ToDer`: an IEEE P1363 signature (r || s, what Web Crypto returns) as the DER sequence npm verifies.
 * Boundary: Web Crypto only; the private key comes from the REGISTRY_SIGNING_KEY secret (PKCS#8 PEM) and never leaves
 *           this module.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 9); npm registry signatures.
 */
import type { Bytes } from "#src/interfaces/bytes.type";

/** A DER INTEGER of an unsigned big-endian value. */
function derInteger(value: Uint8Array): number[] {
  let start = 0;
  while (start < value.length - 1 && value[start] === 0) start += 1;
  const bytes = [...value.subarray(start)];
  if ((bytes[0] ?? 0) >= 0x80) bytes.unshift(0);
  return [0x02, bytes.length, ...bytes];
}

/**
 * An IEEE P1363 signature (r || s, what Web Crypto returns) as the DER sequence npm verifies.
 *
 * @example
 * p1363ToDer(new Uint8Array(64)); // 30 06 02 01 00 02 01 00
 */
export function p1363ToDer(signature: Uint8Array): Bytes {
  const half = signature.length / 2;
  const body = [
    ...derInteger(signature.subarray(0, half)),
    ...derInteger(signature.subarray(half)),
  ];
  return new Uint8Array([0x30, body.length, ...body]);
}
