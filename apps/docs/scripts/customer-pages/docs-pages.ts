/**
 * Stackra file contract:
 * Purpose: `DOCS_PAGES`, the pages folder of the docs app (`src/docs`), resolved from this file so the release-facts
 *          check runs from any working folder.
 * Boundary: one path.
 * Runtime: node
 * Governing contract: ADR 0002 (2026-10-27 amendment: pages in src/docs, scripts outside src/); STA-2847.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The pages folder of the docs app. */
export const DOCS_PAGES = resolve(dirname(fileURLToPath(import.meta.url)), "../../src/docs");
