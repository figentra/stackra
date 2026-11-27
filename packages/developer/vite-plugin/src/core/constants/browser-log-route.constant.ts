/**
 * Stackra file contract:
 * Purpose: `BROWSER_LOG_ROUTE`, the dev server path the page posts what it reports to: `/__stackra/browser-log`.
 *          `browserLogsPlugin` answers it and the client it adds to Vite's own client posts to it.
 * Boundary: a path only; it exists on the dev server only, never in a build.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: the local MCP reads the app); ADR 0261 (decision 4); STA-2889.
 */

/** The dev server path browser reports go to. */
export const BROWSER_LOG_ROUTE = "/__stackra/browser-log";
