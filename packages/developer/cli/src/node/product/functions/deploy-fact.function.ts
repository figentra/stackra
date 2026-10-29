/**
 * Stackra file contract:
 * Purpose: `deployFact(values, flag, variable)`, one OS fact of a product deploy: the `--<flag>` value, else the
 *          environment variable, trimmed; an empty or blank value counts as missing (GitHub passes an unset repository
 *          variable as an empty string), so the deploy names what is missing instead of shipping "".
 * Boundary: pure apart from the environment read.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4); ADR 0437.
 */
import type { CliContext } from "#node/types/cli-context.type";

/**
 * The fact, or `undefined` when it is unset, empty or blank.
 *
 * @example
 * deployFact({ "assets-bucket": " " }, "assets-bucket", "STACKRA_ASSETS_BUCKET"); // the variable, else undefined
 */
export function deployFact(
  values: CliContext["values"],
  flag: string,
  variable: string,
): string | undefined {
  const given = values[flag];
  const flagValue = typeof given === "string" ? given.trim() : "";
  if (flagValue !== "") return flagValue;
  const fromEnvironment = process.env[variable]?.trim() ?? "";
  return fromEnvironment === "" ? undefined : fromEnvironment;
}
