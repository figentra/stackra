/**
 * Stackra file contract:
 * Purpose: `FileExports`, the exported declarations of one source file and the entry folder it sits in, which is what
 *          gen needs to write a package's entry barrels.
 * Boundary: a type only. Re-exports (`export { x } from`) are not declarations and are not listed.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15: entry folders; the barrels are generated); ADR 0295 (decision 7).
 */

/** The exports of one file. */
export interface FileExports {
  /** The source file, relative to the member root. */
  readonly file: string;

  /** The specifier an entry barrel imports it from. */
  readonly importPath: string;

  /** The first folder under `src/` (`core`, `contracts`, `node`, ...), or `""` for a file directly in `src/`. */
  readonly folder: string;

  /** The exported names; `typeOnly` for a type alias or an interface. */
  readonly names: readonly { readonly name: string; readonly typeOnly: boolean }[];

  /** The exported class names, when there is one: `kind_unregistered_base` checks those in a kind file (STA-1306). */
  readonly classes?: readonly string[];
}
