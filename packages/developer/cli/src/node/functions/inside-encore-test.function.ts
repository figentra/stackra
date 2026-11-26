/**
 * Stackra file contract:
 * Purpose: `insideEncoreTest(env)`, whether this process runs as the test command `encore test` started: Encore hands
 *          its test command the runtime configuration and the app metadata (`ENCORE_RUNTIME_CONFIG` or
 *          `ENCORE_RUNTIME_CONFIG_PATH`, `ENCORE_APP_META` or `ENCORE_APP_META_PATH`). `stackra test --tier wiring`
 *          starts `encore test` from outside and runs Vitest from inside.
 * Boundary: pure; reads only the variables it is given, never their values' content.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 3: the thin Encore test suite for the wiring); STA-2838.
 */

/** The variables `encore test` sets for its test command; any one of them marks the inside. */
const ENCORE_TEST_VARIABLES = [
  "ENCORE_RUNTIME_CONFIG",
  "ENCORE_RUNTIME_CONFIG_PATH",
  "ENCORE_APP_META",
  "ENCORE_APP_META_PATH",
] as const;

/**
 * Whether `env` is the environment `encore test` gives its test command.
 *
 * @param env - the process environment.
 * @example
 * insideEncoreTest({ ENCORE_RUNTIME_CONFIG: "..." }); // true
 * insideEncoreTest({}); // false
 */
export function insideEncoreTest(env: Readonly<Record<string, string | undefined>>): boolean {
  return ENCORE_TEST_VARIABLES.some((name) => (env[name] ?? "") !== "");
}
