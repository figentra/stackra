/**
 * Stackra file contract:
 * Purpose: `DEV_LOG_PATH`, where the dev log lives, relative to the repository root: `.stackra/logs/dev.ndjson`, one
 *          JSON `DevLogEntry` per line. `stackra dev` copies each member's dev tool output into it and the Vite dev
 *          server adds what the page reported; the local MCP's `logs`, `last_error` and `browser_logs` tools read it.
 * Boundary: a path only; the file is gitignored and machine-local. When it outgrows `DEV_LOG_MAX_BYTES` it moves to
 *           `.stackra/logs/dev.1.ndjson` (the one older file kept) and a new one starts.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1: dev facts under `.stackra/`); ADR 0282 (decision 5: the local MCP reads
 *                     the app); ADR 0147 (decision 1: every line redacted); STA-2889.
 */

/** The dev log file, relative to the repository root. */
export const DEV_LOG_PATH = ".stackra/logs/dev.ndjson";
