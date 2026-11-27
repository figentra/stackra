/**
 * Stackra file contract:
 * Purpose: `finishSteps(tools)`, the numbered steps every local recipe and the guidelines end with: `stackra gen`,
 *          then `stackra gen --check`, then the tests, each named by the tool that runs it. The tests run through a
 *          `test` tool when the server offers one, otherwise through `verify`, the full gate.
 * Boundary: pure; names only tools in `tools`, so a recipe never sends an assistant to a tool that does not exist.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); ADR 0294 (decision 22: `stackra gen --check` is the gate); STA-2919.
 */

/**
 * The closing steps of a change.
 *
 * @param tools - every tool name the server lists.
 * @example
 * finishSteps(new Set(["gen", "verify"])); // "1. Run `stackra gen` …"
 */
export function finishSteps(tools: ReadonlySet<string>): string {
  const tests = tools.has("test")
    ? "the tests with the `test` tool"
    : "the tests with the `verify` tool (`stackra verify`: format, lint, typecheck, test, build and validate)";
  return [
    "1. Run `stackra gen` (the `gen` tool) so every generated file follows the source. Never edit a generated file by hand: the next run overwrites it.",
    "2. Run `stackra gen --check` (the `gen` tool with `check: true`). It must end with every member up to date and no refusal.",
    `3. Run ${tests}. They must pass.`,
    "",
    "Report both results as they printed. The work is not done while either fails.",
  ].join("\n");
}
