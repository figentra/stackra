/**
 * Stackra file contract:
 * Purpose: `DEV_SECRETS_FILE`, where `stackra dev secrets init` writes a workspace's generated dev values, relative to
 *          the workspace root.
 * Boundary: data only. The `.stackra/` ignore in `.gitignore` keeps it out of git; the testbed upload excludes it.
 * Runtime: node
 * Governing contract: ADR 0525 (amendment of 2026-11-10); STA-2679.
 */

/** The generated dev values of a workspace, by secret name. */
export const DEV_SECRETS_FILE = ".stackra/dev-secrets.json";
