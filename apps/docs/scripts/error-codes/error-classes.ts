/**
 * Stackra file contract:
 * Purpose: `errorClasses(dir)`, the names of the error classes a tool throws: the classes declared in its
 *          `*.error.ts` files.
 * Boundary: reads the source through `sourceFiles`; top-level class declarations only.
 * Runtime: node
 * Governing contract: ADR 0231 (snake_case machine codes); ADR 0294 (decision 22: a refusal names its code and fix);
 *                     ADR 0282 (decision 3: `stackra check`); ADR 0296 (runway enforcement); STA-2853.
 */
import ts from "typescript6";

import { sourceFiles } from "#scripts/error-codes/source-files";

/**
 * The names of the classes declared in the `*.error.ts` files under `dir`.
 *
 * @param dir - the source folder of one tool.
 * @returns the class names, sorted.
 * @example
 * errorClasses("packages/developer/runway/src"); // ["RunwayDeployFailedError", "RunwayInvalidError", …]
 */
export function errorClasses(dir: string): string[] {
  return sourceFiles(dir)
    .filter(({ path }) => path.endsWith(".error.ts"))
    .flatMap(({ file }) =>
      file.statements.flatMap((statement) =>
        ts.isClassDeclaration(statement) && statement.name !== undefined
          ? [statement.name.text]
          : [],
      ),
    )
    .toSorted();
}
