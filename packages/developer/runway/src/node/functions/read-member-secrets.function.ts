/**
 * Stackra file contract:
 * Purpose: `readMemberSecrets({ environment, member, runways })`, the values of the secrets one member declares for
 *          one environment, read from the job's environment, where the shared `secrets-decrypt` action put the
 *          product's sops scope (`products/<project>/<env>`, ADR 0525). The secret sync writes them into Encore, and
 *          the Workers provider uploads them with a version.
 * Boundary: the values live in memory only: they are returned, never logged, printed, written to a file or put in an
 *           argument, and no error carries one, only names. It runs only in a GitHub Actions job of the repository,
 *           proved by GitHub's signed OIDC token (`proveGithubJob`), never by `GITHUB_ACTIONS`; anywhere else it
 *           refuses before reading. Every declared name must be set, or it throws naming the missing ones; other
 *           names in the environment are not returned.
 * Runtime: node
 * Governing contract: ADR 0525 (sops; CI decrypts in place); ADR 0257; ADR 0267 (nobody reads a value); STA-606;
 *                     STA-1990 (the Workers provider reads through it); STA-2100 (the OIDC proof).
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { proveGithubJob } from "#node/functions/prove-github-job.function";
import { secretSyncPlan } from "#node/functions/secret-sync-plan.function";
import type { DeployRunways } from "#node/types/deploy-runways.type";

/**
 * The values of `member`'s declared secrets for `environment`, in memory only and in CI only.
 *
 * @param input.environment - the runway environment (`staging`).
 * @param input.member - the member folder name (`api`).
 * @param input.runways - the root and member runways (`readRunways`).
 * @param input.ci - a test's answer to "is this a proved CI job"; by default `proveGithubJob` answers it.
 * @param input.env - the job's environment; `process.env` by default, and a test replaces it.
 * @throws RunwayUnresolvedError outside CI, or when a declared name is not set; the message names names, never a
 *         value.
 * @example
 * const values = await readMemberSecrets({ environment: "staging", member: "api", runways: readRunways(root) });
 * values.get("STRIPE_SECRET_KEY"); // the value, for a stdin or a mode-600 secrets file
 */
export async function readMemberSecrets(input: {
  readonly environment: string;
  readonly member: string;
  readonly runways: DeployRunways;
  readonly ci?: boolean | undefined;
  readonly env?: Readonly<Record<string, string | undefined>> | undefined;
}): Promise<ReadonlyMap<string, string>> {
  const { environment, member, runways } = input;
  if (input.ci === false)
    throw new RunwayUnresolvedError(
      `secret values are read only in a CI deploy job of the repository (proved by its GitHub OIDC token); run the sync with --dry-run here to see the names`,
    );
  // The proof's refusal names what is missing; it never carries the token.
  if (input.ci === undefined) await proveGithubJob({ github: runways.root.providers.github });
  const entry = secretSyncPlan(environment, runways).find((item) => item.member === member);
  if (entry === undefined) return new Map();
  const env = input.env ?? process.env;
  const missing = entry.names.filter((name) => (env[name] ?? "") === "");
  if (missing.length > 0)
    throw new RunwayUnresolvedError(
      `the job's environment lacks ${member}'s ${missing.join(", ")}: decrypt ${entry.scope ?? `the product's ${environment} scope`} first (.github/actions/secrets-decrypt)`,
    );
  return new Map(entry.names.map((name) => [name, env[name] ?? ""]));
}
