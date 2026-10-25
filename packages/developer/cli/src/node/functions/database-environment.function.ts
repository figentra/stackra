/**
 * Stackra file contract:
 * Purpose: `databaseEnvironment(values)`, the environment a `stackra db` command targets: `--env`, else
 *          `STACKRA_ENVIRONMENT`, else `dev`.
 * Boundary: pure over its input and the process environment; it checks the spelling and never reads a database or a
 *           secret.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended); ADR 0296 (the four runway environments, plus `test`).
 */
import { CliUsageError } from "#node/errors/cli-usage.error";
import type { CliContext } from "#node/types/cli-context.type";

const ENVIRONMENTS = ["dev", "preview", "test", "staging", "production"];

/**
 * The target environment.
 *
 * @param values - the parsed options of the command.
 * @throws CliUsageError when the name is not an environment.
 * @example
 * databaseEnvironment({ env: "preview" }); // "preview"
 */
export function databaseEnvironment(values: CliContext["values"]): string {
  const option = values["env"];
  const name = typeof option === "string" ? option : (process.env["STACKRA_ENVIRONMENT"] ?? "dev");
  if (!ENVIRONMENTS.includes(name)) {
    throw new CliUsageError(`unknown environment: ${name} (expected ${ENVIRONMENTS.join(", ")})`);
  }
  return name;
}
