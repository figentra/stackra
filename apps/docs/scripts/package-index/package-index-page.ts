/**
 * Stackra file contract:
 * Purpose: `PACKAGE_INDEX_PAGE`, the committed page the package-index writer owns (`src/docs/customers/packages.mdx`,
 *          served at `/customers/packages`).
 * Boundary: one path, resolved from this file so the writer runs from any working folder.
 * Runtime: node
 * Governing contract: ADR 0002 (2026-10-27 amendment: pages in src/docs, scripts outside src/); STA-2847.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The committed package index page. */
export const PACKAGE_INDEX_PAGE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../src/docs/customers/packages.mdx",
);
