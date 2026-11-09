/**
 * Stackra file contract:
 * Purpose: `emitEncorePackage`, the `package.json` at the root of a service's generated Encore application
 *          (`.stackra/encore/package.json`): Encore reads the app root's `package.json` to start the app, and fails
 *          `encore check`, `run` and `build` with "failed to read package.json" without one.
 * Boundary: pure; private, ES modules, no dependencies of its own: `encore.dev` and the member's packages resolve from
 *           the member's `node_modules` two folders up, as Node walks up from the app. JSON only, no comment; written
 *           beside `encore.app` and only when it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 (decision 2: gen emits the whole Encore app into `.stackra/encore`); ADR 0029.
 */
import type { GeneratedFile } from "#core/types/generated-file.type";

/**
 * The Encore app's `package.json` of service package `pkg`.
 *
 * @example
 * emitEncorePackage("@figentra/service-sales").path; // ".stackra/encore/package.json"
 */
export function emitEncorePackage(pkg: string): GeneratedFile {
  return {
    path: ".stackra/encore/package.json",
    content: `${JSON.stringify({ name: `${pkg}-encore`, private: true, type: "module" }, null, 2)}\n`,
  };
}
