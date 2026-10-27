/**
 * Stackra file contract:
 * Purpose: `json`: A JSON response.
 * Boundary: builds Response objects only.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 4).
 */
import { PRIVATE_NO_STORE } from "#src/constants/private-no-store.constant";

/**
 * A JSON response.
 *
 * @example
 * json({ ok: true }); // 200, application/json, private no-store
 */
export function json(
  body: unknown,
  status = 200,
  headers: Readonly<Record<string, string>> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": PRIVATE_NO_STORE,
      ...headers,
    },
  });
}
