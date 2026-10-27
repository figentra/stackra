/**
 * Stackra file contract:
 * Purpose: `DOCS_CONFIG_FILE`, the file that makes a member a docs app: its `DocsConfig` subclass, relative to the
 *          member root. Gen and `stackra dev|build|lint` take the docs-site path when it exists.
 * Boundary: a constant.
 * Runtime: isomorphic
 * Governing contract: ADR 0002 (2026-10-27 amendment); ADR 0295 (decision 4: Config classes in `src/config/`).
 */

/** The docs app's site configuration. */
export const DOCS_CONFIG_FILE = "src/config/docs.config.ts";
