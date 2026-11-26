/**
 * Stackra file contract:
 * Purpose: `createCodemodProject(engines)`, the in-memory ts-morph project an upgrade edits source files in, one file
 *          at a time: no disk, no lib files, JavaScript and JSX allowed, so a rename resolves inside the one file.
 * Boundary: creates an object; reads no file.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2: ts-morph); STA-145.
 */
import type { Project } from "ts-morph";

import type { CodemodEngines } from "#node/upgrade/types/codemod-engines.type";

/**
 * Creates the in-memory ts-morph project every source codemod edits files in.
 *
 * @example
 * const project = createCodemodProject(await loadCodemodEngines());
 */
export function createCodemodProject({ tsMorph }: CodemodEngines): Project {
  return new tsMorph.Project({
    useInMemoryFileSystem: true,
    skipLoadingLibFiles: true,
    compilerOptions: { allowJs: true, jsx: tsMorph.ts.JsxEmit.Preserve, noLib: true },
  });
}
