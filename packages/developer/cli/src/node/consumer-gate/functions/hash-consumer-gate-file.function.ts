/**
 * Stackra file contract:
 * Purpose: `hashConsumerGateFile(path)`, the sha256 (hex) of a file, or `undefined` when there is none.
 * Boundary: reads one file.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

/**
 * The file's sha256.
 *
 * @param path - the file.
 * @example
 * hashConsumerGateFile("/x/pnpm-lock.yaml"); // "9f86d0..." or undefined
 */
export function hashConsumerGateFile(path: string): string | undefined {
  return existsSync(path)
    ? createHash("sha256").update(readFileSync(path)).digest("hex")
    : undefined;
}
