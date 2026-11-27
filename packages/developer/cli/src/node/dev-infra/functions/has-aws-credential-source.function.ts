/**
 * Stackra file contract:
 * Purpose: `hasAwsCredentialSource(env, home)`, whether the AWS SDK's default credential chain has a source of its own
 *          for a local run: key variables, a profile, a web identity token, a container credential endpoint, or a
 *          shared credentials or config file (`~/.aws/credentials`, `~/.aws/config` or the files their variables
 *          name). `devInfraEnv` gives SeaweedFS's placeholder key pair only when this is false, so a developer's real
 *          credential is never shadowed for the other AWS clients (Bedrock, Secrets Manager, SES, …).
 * Boundary: reads `env` and checks two files exist; never reads a file or a value. An EC2 instance role alone is not
 *           seen (it needs a network call): on such a host an empty `~/.aws/config` keeps the placeholder pair out,
 *           and the chain still reaches the role.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 3); ADR 0173 (no secret values); STA-2664 (item 6).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

/** The variables that are each a credential source of the default chain on their own. */
const SOURCE_VARIABLES = [
  "AWS_ACCESS_KEY_ID",
  "AWS_PROFILE",
  "AWS_WEB_IDENTITY_TOKEN_FILE",
  "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI",
  "AWS_CONTAINER_CREDENTIALS_FULL_URI",
] as const;

/**
 * Whether the AWS SDK finds a credential of its own for a run with `env`.
 *
 * @param env - the environment the run gets.
 * @param home - the home folder the shared AWS files default to.
 * @example
 * hasAwsCredentialSource({ AWS_PROFILE: "dev" }, "/home/me"); // true
 */
export function hasAwsCredentialSource(
  env: Readonly<Record<string, string | undefined>>,
  home: string,
): boolean {
  if (SOURCE_VARIABLES.some((name) => (env[name] ?? "") !== "")) return true;
  const credentials = env["AWS_SHARED_CREDENTIALS_FILE"] || join(home, ".aws", "credentials");
  const config = env["AWS_CONFIG_FILE"] || join(home, ".aws", "config");
  return existsSync(credentials) || existsSync(config);
}
