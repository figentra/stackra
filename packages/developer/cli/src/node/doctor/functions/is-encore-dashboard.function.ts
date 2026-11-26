/**
 * Stackra file contract:
 * Purpose: `isEncoreDashboard(status, body)`, whether an HTTP answer is the Encore development dashboard's page (the
 *          one the Encore daemon serves on its dashboard port and `encore run` reuses).
 * Boundary: pure; reads only the answer it is given.
 * Runtime: node
 * Governing contract: STA-2794 (a second `stackra dev` reuses the user's own Encore daemon).
 */

/**
 * Whether the answer is the Encore development dashboard.
 *
 * @param status - the HTTP status of `GET /`.
 * @param body - its body.
 * @example
 * isEncoreDashboard(200, "<title>Encore Development Dashboard</title>"); // true
 */
export function isEncoreDashboard(status: number, body: string): boolean {
  return status === 200 && /<title>\s*Encore Development Dashboard\s*<\/title>/i.test(body);
}
