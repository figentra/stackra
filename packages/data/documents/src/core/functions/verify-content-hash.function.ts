/**
 * Stackra file contract:
 * Purpose: `verifyContentHash`, whether stored bytes still have the content hash recorded when they were rendered or
 *          signed.
 * Boundary: recomputes with `contentHashOf`; any other algorithm prefix answers `false`.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 4).
 */
import { contentHashOf } from "#core/functions/content-hash-of.function";

/**
 * Whether `bytes` hash to `expected`.
 *
 * @example
 * if (!(await verifyContentHash(stored, form.pdf.contentHash))) throw TamperedFileError.create({ fileId });
 */
export async function verifyContentHash(bytes: Uint8Array, expected: string): Promise<boolean> {
  return (await contentHashOf(bytes)) === expected;
}
