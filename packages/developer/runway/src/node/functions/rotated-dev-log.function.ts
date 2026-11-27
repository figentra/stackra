/**
 * Stackra file contract:
 * Purpose: `rotatedDevLog(file)`, the one older dev log kept beside `file` once it outgrows `DEV_LOG_MAX_BYTES`:
 *          `dev.ndjson` → `dev.1.ndjson`.
 * Boundary: a path only; `appendDevLog` moves the file there and `readDevLog` reads it first.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 1); STA-2889.
 */

/**
 * The rotated file beside `file`.
 *
 * @param file - the dev log.
 * @example
 * rotatedDevLog("/work/acme/.stackra/logs/dev.ndjson"); // "/work/acme/.stackra/logs/dev.1.ndjson"
 */
export function rotatedDevLog(file: string): string {
  return file.endsWith(".ndjson") ? `${file.slice(0, -".ndjson".length)}.1.ndjson` : `${file}.1`;
}
