/**
 * Stackra file contract:
 * Purpose: `tokensMatch(given, expected)`, a string check in constant time: both sides are hashed with SHA-256 first,
 *          so the comparison always walks 32 bytes whatever the lengths, and leaks neither length nor prefix. A copy of
 *          workers/turbo-cache's, since a Worker never imports another Worker.
 * Boundary: pure; Web Crypto only (`crypto.subtle`, present in Workers and Node), no secret is logged or returned.
 * Runtime: worker
 * Governing contract: ADR 0173 (amendment of 2026-11-04, decision 6); ADR 0003 (no import across apps).
 */

const encoder = new TextEncoder();

/** SHA-256 of `value` as bytes. */
const digest = async (value: string): Promise<Uint8Array> =>
  new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));

/**
 * Whether `given` equals `expected`, compared in constant time.
 *
 * @example
 * if (!(await tokensMatch(signature, expected))) return new Response(null, { status: 401 });
 */
export async function tokensMatch(given: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([digest(given), digest(expected)]);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  return difference === 0;
}
