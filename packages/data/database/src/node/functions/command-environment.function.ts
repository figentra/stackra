/**
 * Stackra file contract:
 * Purpose: `commandEnvironment(given, env)`, the environment a database command acts in: the process's
 *          `STACKRA_ENVIRONMENT` (what runway and `@stackra/config` set), else `--env`, else `dev`, checked against the
 *          known environments. A `--env` that differs from a set `STACKRA_ENVIRONMENT` is refused, so a production
 *          shell can never be relabelled `dev` to pass rollback's forward-only guard.
 * Boundary: pure; the connection itself is always `DATABASE_DIRECT_URL`, which is why the label must not be chosen
 *           freely.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-013 and FR-015 (security review B2); the CLI's `databaseEnvironment` rule.
 */
import { UsageError } from "@stackra/console";

/** The environments a database command knows. */
const ENVIRONMENTS: readonly string[] = ["dev", "preview", "test", "staging", "production"];

/**
 * The environment of a database command.
 *
 * @param given - the `--env` value, or `""` when it was not given.
 * @param env - the process environment.
 * @throws UsageError when the name is unknown, or `--env` contradicts `STACKRA_ENVIRONMENT`.
 * @example
 * commandEnvironment("", { STACKRA_ENVIRONMENT: "production" }); // "production"
 */
export function commandEnvironment(
  given: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const fromProcess = env["STACKRA_ENVIRONMENT"] ?? "";
  if (given !== "" && fromProcess !== "" && given !== fromProcess)
    throw new UsageError(
      `--env ${given} does not match STACKRA_ENVIRONMENT=${fromProcess}`,
      "Run the command in a shell for that environment instead",
    );
  const name = given || fromProcess || "dev";
  if (!ENVIRONMENTS.includes(name))
    throw new UsageError(`unknown environment: ${name} (expected ${ENVIRONMENTS.join(", ")})`);
  return name;
}
