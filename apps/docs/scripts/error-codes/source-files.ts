/**
 * Stackra file contract:
 * Purpose: `sourceFiles(dir)`, the parsed non-test TypeScript files of a tool's source folder, the input of
 *          `emittedCodes`, `declaredCodes` and `errorClasses`.
 * Boundary: reads `.ts` files under `dir`, tests (`__tests__`), declaration files and the error-code catalogue
 *           (`@stackra/gen`'s `ERROR_CODES`, a copy of the page whose rows look like findings, STA-2891) excluded;
 *           parses with the TypeScript 6 compiler API and never type-checks or runs the source.
 * Runtime: node
 * Governing contract: ADR 0231 (snake_case machine codes); ADR 0294 (decision 22: a refusal names its code and fix);
 *                     ADR 0282 (decision 3: `stackra check`); ADR 0296 (runway enforcement); STA-2853; STA-2891.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript6";

import { CATALOGUE_PATHS } from "#scripts/error-codes/catalogue-paths";

/**
 * The parsed non-test TypeScript files under `dir`, by path.
 *
 * @param dir - the folder to read.
 * @returns each file's path relative to `dir` and its parsed source, sorted by path.
 * @example
 * sourceFiles("packages/developer/runway/src").map(({ path }) => path); // ["core/index.ts", …]
 */
export function sourceFiles(
  dir: string,
): { readonly path: string; readonly file: ts.SourceFile }[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter(
      (path) =>
        path.endsWith(".ts") &&
        !path.endsWith(".d.ts") &&
        !path.split(/[/\\]/).includes("__tests__") &&
        !join(dir, path).endsWith(CATALOGUE_PATHS.catalogue),
    )
    .toSorted()
    .map((path) => ({
      path,
      file: ts.createSourceFile(
        path,
        readFileSync(join(dir, path), "utf8"),
        ts.ScriptTarget.Latest,
        true,
      ),
    }));
}
