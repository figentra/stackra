/**
 * Stackra file contract:
 * Purpose: `hashAccessLink`, the hash of one chain link: SHA-256, lowercase hex, over the previous link's hash, the
 *          sequence and the record's fields as canonical JSON.
 * Boundary: internal to the package (`linkAccessRecord` and `findChainBreak` share it, so building and verifying never
 *           drift). Canonical means object keys sorted at every depth, absent fields dropped and dates as ISO 8601, so a
 *           record read back from jsonb, whose keys Postgres reorders, hashes as it did when written. Web Crypto only,
 *           so it runs in Node, a browser and a worker.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a hash chain).
 */
import type { AccessRecord } from "#contracts/types/access-record.type";

/** `value` as canonical JSON. */
function canonical(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    const fields = value as Record<string, unknown>;
    const keys = Object.keys(fields)
      .filter((key) => fields[key] !== undefined)
      .sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonical(fields[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/**
 * The hash of the link that puts `record` at `sequence` after the link whose hash is `previousHash`.
 *
 * @param record - the access record; only its record fields are read.
 * @param sequence - the link's position in its chain.
 * @param previousHash - the hash of the link before it.
 * @returns 64 lowercase hex characters.
 */
export async function hashAccessLink(
  record: AccessRecord,
  sequence: number,
  previousHash: string,
): Promise<string> {
  const text = canonical([
    previousHash,
    sequence,
    record.callId,
    record.actor,
    record.target,
    record.classification,
    record.subjects,
    record.at,
  ]);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
