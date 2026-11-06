/**
 * Stackra file contract:
 * Purpose: `readMemberSecrets({ environment, member, runways })`, the values of the secrets one member declares for
 *          one environment, read from Infisical: the root runway's workspace (`providers.infisical.workspace`), the
 *          Infisical environment it maps `environment` to, and the member's runtime folder (`<runtime path>/<member>`,
 *          ADR 0512). The secret sync writes them into Encore, and the Workers provider uploads them with a version.
 *          With `source: "environment"` they come from the job's environment instead, where the shared
 *          `secrets-decrypt` action put the product's sops scope (ADR 0525); Infisical is not read.
 * Boundary: the values live in memory only: they are returned, never logged, printed, written to a file or put in an
 *           argument, and no error carries one, only names. It runs only in a GitHub Actions job of the repository,
 *           proved by GitHub's signed OIDC token (`proveGithubJob`), never by `GITHUB_ACTIONS`; anywhere else it
 *           refuses before reading.
 *           `infisical export` runs through the `CommandRunner`, and its output never reaches an error or `cause`.
 *           Every declared name must exist in the folder, or it throws naming the missing ones; other names in the
 *           folder are not returned.
 * Runtime: node
 * Governing contract: ADR 0173 (nobody reads a value; Infisical is the source); ADR 0512 (one project per reader,
 *                     `/runtime/<member>`); ADR 0257; STA-606; STA-1990 (the Workers provider reads through it);
 *                     STA-2100 (the OIDC proof).
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { proveGithubJob } from "#node/functions/prove-github-job.function";
import { exportInfisicalFolder } from "#node/functions/export-infisical-folder.function";
import { secretSyncPlan } from "#node/functions/secret-sync-plan.function";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { DeployRunways } from "#node/types/deploy-runways.type";

/**
 * The values of `member`'s declared secrets for `environment`, in memory only and in CI only.
 *
 * @param input.environment - the runway environment (`staging`).
 * @param input.member - the member folder name (`api`).
 * @param input.runways - the root and member runways (`readRunways`).
 * @param input.run - the command runner; `runProgram` by default.
 * @param input.ci - a test's answer to "is this a proved CI job"; by default `proveGithubJob` answers it.
 * @throws RunwayUnresolvedError outside CI, when the root runway maps no Infisical environment, workspace or runtime
 *         path, when the export fails, or when a declared name is missing; the message names names, never a value.
 * @example
 * const values = await readMemberSecrets({ environment: "staging", member: "api", runways: readRunways(root) });
 * values.get("STRIPE_SECRET_KEY"); // the value, for a stdin or a mode-600 secrets file
 */
export async function readMemberSecrets(input: {
  readonly environment: string;
  readonly member: string;
  readonly runways: DeployRunways;
  readonly run?: CommandRunner | undefined;
  readonly ci?: boolean | undefined;
  /**
   * Where the values come from: Infisical (the default), or the job's environment, which the shared
   * `secrets-decrypt` action filled from the product's sops scope (ADR 0525).
   */
  readonly source?: "infisical" | "environment" | undefined;
  /** The job's environment for `source: "environment"`; a test replaces it. */
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
  if (input.source === "environment") {
    const env = input.env ?? process.env;
    const missing = entry.names.filter((name) => (env[name] ?? "") === "");
    if (missing.length > 0)
      throw new RunwayUnresolvedError(
        `the job's environment lacks ${member}'s ${missing.join(", ")}: decrypt the product's ${environment} scope first (.github/actions/secrets-decrypt)`,
      );
    return new Map(entry.names.map((name) => [name, env[name] ?? ""]));
  }
  const infisical = runways.root.providers.infisical;
  const infisicalEnvironment = infisical?.environments?.[environment];
  if (infisicalEnvironment === undefined)
    throw new RunwayUnresolvedError(
      `runway.yaml maps no Infisical environment for ${environment} (providers.infisical.environments.${environment})`,
    );
  if (infisical?.workspace === undefined || infisical.workspace.startsWith("ref:"))
    throw new RunwayUnresolvedError(
      `runway.yaml names no Infisical project id for the runtime secrets (providers.infisical.workspace${infisical?.workspace === undefined ? "" : ` is ${infisical.workspace}`}): bind the product's own project (ADR 0512)`,
    );
  if (entry.path === null)
    throw new RunwayUnresolvedError(
      `runway.yaml names no runtime folder for ${member}'s secrets (secrets.defaultPath in providers.infisical.paths)`,
    );
  const where = `${infisicalEnvironment}:${entry.path}`;
  let pairs: ReadonlyMap<string, string>;
  try {
    pairs = await exportInfisicalFolder({
      projectId: infisical.workspace,
      environment: infisicalEnvironment,
      path: entry.path,
      domain: infisical.domain,
      run: input.run,
    });
  } catch {
    throw new RunwayUnresolvedError(
      `infisical export of ${member}'s secrets (${where}) failed: check the job's Infisical login and that its identity may read ${entry.path}`,
    );
  }
  const missing = entry.names.filter((name) => !pairs.has(name));
  if (missing.length > 0)
    throw new RunwayUnresolvedError(
      `Infisical ${where} lacks ${member}'s ${missing.join(", ")}: the owner sets ${missing.length === 1 ? "it" : "them"} (runbooks/secrets)`,
    );
  return new Map(entry.names.map((name) => [name, pairs.get(name) ?? ""]));
}
