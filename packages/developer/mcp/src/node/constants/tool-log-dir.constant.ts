/**
 * Stackra file contract:
 * Purpose: `TOOL_LOG_DIR`, the folder under the repository root where each local MCP tool writes the full log of its
 *          last run, `last-<tool>.log`.
 * Boundary: data only. The folder sits in `.stackra/`, which every Stackra repository ignores.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); STA-2886.
 */

/** The tool log folder, from the repository root. */
export const TOOL_LOG_DIR = ".stackra/logs";
