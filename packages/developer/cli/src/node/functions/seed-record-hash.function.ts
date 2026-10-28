/**
 * Stackra file contract:
 * Purpose: `seedRecordHash(record)`, the SHA-256 of a seed record's kind, key and rows in a stable key order, so a
 *          reformatted file hashes the same and a changed value does not.
 * Boundary: pure; the file and profile do not take part, so moving a document does not re-seed it.
 * Runtime: node
 * Governing contract: ADR 0325 (decision 7: seeds are resumable); config-model section 6.
 */
import { createHash } from "node:crypto";

import type { SeedRecord } from "#node/types/seed-record.type";

/** A JSON text with object keys sorted at every level. */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (typeof value === "object" && value !== null)
    return `{${Object.keys(value)
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

/**
 * The content hash of a record.
 *
 * @param record - the seed record.
 * @example
 * seedRecordHash(record); // "9f2c…" (64 hex characters)
 */
export function seedRecordHash(record: Pick<SeedRecord, "kind" | "key" | "rows">): string {
  return createHash("sha256")
    .update(stable({ kind: record.kind, key: record.key, rows: record.rows }))
    .digest("hex");
}
