/**
 * Stackra file contract:
 * Purpose: the app definition of @figentra/docs, the docs site: no runtime target, so gen builds no bundle; it
 *          assembles the Mintlify site from `src/config/docs.config.ts` into `.stackra/site/` instead.
 * Boundary: data only; no function, no environment read and no import of the app's own code.
 * Runtime: node
 * Governing contract: ADR 0295 (decisions 1 and 2); ADR 0002 (2026-10-27 amendment); ADR 0082 (API areas).
 */
import { ApiArea, defineApp } from "@stackra/contracts";

export default defineApp({ targets: [], area: ApiArea.Public, name: "Stackra" });
