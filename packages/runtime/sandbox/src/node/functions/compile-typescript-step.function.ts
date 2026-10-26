/**
 * Stackra file contract:
 * Purpose: `compileTypeScriptStep`, a TypeScript code step compiled to the JavaScript `Sandbox` runs, once, when the
 *          step is saved: the types are erased and nothing else changes, so line and column numbers in a failure
 *          still point at what the tenant wrote.
 * Boundary: node only, through Node's own type stripping (`module.stripTypeScriptTypes`, strip mode), so no compiler
 *           is a dependency and no type is checked. TypeScript that needs code generated (an `enum`, a `namespace`, a
 *           parameter property) is refused with Node's message, as is a syntax error. The step is compiled as the body
 *           of `async function (input: unknown)`, as `Sandbox` runs it, so `await` and `return` work at its top level.
 *           The stored step keeps both texts: the TypeScript to edit, the JavaScript to run.
 * Runtime: node
 * Governing contract: ADR 0434 (decision 3); ADR 0154 (decisions 1 and 2).
 */
import { stripTypeScriptTypes } from "node:module";

/** What the step is compiled inside; its types become blanks of the same length, so the slice below is exact. */
const PREFIX = "async function step(input: unknown) {\n";

/** The end of the wrapper. */
const SUFFIX = "\n}";

/**
 * The JavaScript of a TypeScript step body.
 *
 * @example
 * compileTypeScriptStep("const lines: Line[] = input.lines;\nreturn { count: lines.length };");
 * // "const lines         = input.lines;\nreturn { count: lines.length };"
 * @throws SyntaxError when the step does not parse or needs code generated; the message is Node's.
 */
export function compileTypeScriptStep(source: string): string {
  let stripped: string;
  try {
    stripped = stripTypeScriptTypes(`${PREFIX}${source}${SUFFIX}`, { mode: "strip" });
  } catch (error) {
    throw new SyntaxError(
      `The TypeScript step cannot be compiled: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return stripped.slice(PREFIX.length, stripped.length - SUFFIX.length);
}
