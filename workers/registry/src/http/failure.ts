/**
 * Stackra file contract:
 * Purpose: `failure`: an error in npm's shape.
 * Boundary: builds Response objects only.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 4).
 */
import { json } from "#src/http/json";

/**
 * An error in npm's shape.
 *
 * @example
 * failure(404, "not_found"); // { "error": "not_found" }
 */
export function failure(
  status: number,
  error: string,
  headers: Readonly<Record<string, string>> = {},
): Response {
  return json({ error }, status, headers);
}
