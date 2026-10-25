/**
 * Stackra file contract:
 * Purpose: `fingerprintOf`, the SHA-256 (hex) of a call's identity and input with object keys sorted, which the
 *          idempotency step stores with a key and compares on reuse, and from which a derived key is made.
 * Boundary: pure apart from the platform's Web Crypto (`globalThis.crypto.subtle`, Node 20+, Workers, browsers). Dates
 *           hash as ISO strings, key order never matters, array order does. A value JSON cannot hold (a `bigint`, a
 *           cycle) throws, because such an input is not a wire input.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3: a hash of the payload).
 */

/** Sorts plain objects' keys so equal inputs stringify equally. */
function sorted(_key: string, value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    ),
  );
}

/**
 * The hex SHA-256 of `parts`.
 *
 * @throws TypeError when `parts` holds a value JSON cannot represent.
 * @example
 * await fingerprintOf("orders.order.create@1", input); // "9f86d081…"
 */
export async function fingerprintOf(...parts: readonly unknown[]): Promise<string> {
  const text = JSON.stringify(parts, sorted);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
