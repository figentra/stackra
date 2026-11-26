/**
 * Stackra file contract:
 * Purpose: `emitEncoreApp`, the app file of a service's generated Encore application, at the member root (`encore.app`, gitignored):
 *          `{ id, lang: "typescript" }`, the id being the root runway's `providers.encore.app`, so `encore run` in the
 *          member (what `stackra dev` starts) finds its app and resolves the member's `#` imports and node_modules.
 * Boundary: pure; the caller reads the id from the root runway and refuses a missing one (`encore_app_missing`). JSON
 *           only, no comment: Encore reads the file as is, and `generate` writes it only when its content changes.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 (decision 2 as amended 2026-11-09: the app root is the member root; as amended
 *                     2026-11-10: the services are in `stackra-encore`); ADR 0029 (one Encore app); ADR 0296 (the
 *                     root runway); STA-1322.
 */
import type { GeneratedFile } from "#core/types/generated-file.type";

/**
 * The Encore app file of a service.
 *
 * @param id - the Encore app id, the root runway's `providers.encore.app`.
 * @example
 * emitEncoreApp("figentra-commerce").content; // '{\n  "id": "figentra-commerce",\n  "lang": "typescript"\n}\n'
 */
export function emitEncoreApp(id: string): GeneratedFile {
  return {
    path: "encore.app",
    content: `${JSON.stringify({ id, lang: "typescript" }, null, 2)}\n`,
  };
}
