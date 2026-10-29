/**
 * Stackra file contract:
 * Purpose: `defineCall`, the one reader of a `stackra.config.ts` `define*` call: its name, line and argument as static
 *          data (`staticLiteral`). `readMemberFacts` takes the layout, `area` and `targets` from it, and
 *          `readAppDefinition` the whole `defineApp` argument, so both read the same call the same way.
 * Boundary: pure. Only a line that starts `export default define…(` counts, so a call quoted in a comment or doc
 *           header is never read. An argument that is not static data comes back as the Error `staticLiteral` threw.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 1: one static `define*` call gen reads without running it).
 */
import { staticLiteral } from "#core/functions/static-literal.function";

/**
 * The `export default define*(…)` call of a `stackra.config.ts` text, or undefined when it has none.
 *
 * @param text - the `stackra.config.ts` source.
 * @example
 * defineCall('export default defineApp({ scheme: "acme" });\n')?.argument; // { scheme: "acme" }
 */
export function defineCall(
  text: string,
): { readonly name: string; readonly line: number; readonly argument: unknown } | undefined {
  const call = /^export\s+default\s+(define(?:App|Package|Service|Worker))\s*\(/m.exec(text);
  if (call === null) return undefined;
  let argument: unknown;
  try {
    argument = staticLiteral(text.slice(call.index + call[0].length)).value;
  } catch (error) {
    argument = error instanceof Error ? error : new Error(String(error));
  }
  return {
    name: call[1] ?? "",
    line: text.slice(0, call.index).split("\n").length,
    argument,
  };
}
