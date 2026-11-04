/**
 * Stackra file contract:
 * Purpose: `readMemberSecrets({ environment, member, runways })`, the values of the secrets one member declares for
 *          one environment, read from Infisical: the root runway's workspace (`providers.infisical.workspace`), the
 *          Infisical environment it maps `environment` to, and the member's runtime folder (`<runtime path>/<member>`,
 *          ADR 0512). The secret sync writes them into Encore, and the Workers provider uploads them with a version.
 * Boundary: the values live in memory only: they are returned, never logged, printed, written to a file or put in an
 *           argument, and no error carries one, only names. It runs only in CI (`GITHUB_ACTIONS=true`, whose job
 *           logged in to Infisical with its environment's own OIDC identity); anywhere else it refuses before reading.
 *           `infisical export` runs through the `CommandRunner`, and its output never reaches an error or `cause`.
 *           Every declared name must exist in the folder, or it throws naming the missing ones; other names in the
 *           folder are not returned.
 * Runtime: node
 * Governing contract: ADR 0173 (nobody reads a value; Infisical is the source); ADR 0512 (one project per reader,
 *                     `/runtime/<member>`); ADR 0257; STA-606; STA-1990 (the Workers provider reads through it).
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { runCommand } from "#node/functions/run-command.function";
import { secretSyncPlan } from "#node/functions/secret-sync-plan.function";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { DeployRunways } from "#node/types/deploy-runways.type";

/** One secret as `infisical export --format json` prints it. */
type ExportedSecret = { readonly key?: unknown; readonly value?: unknown };

/** The name → value pairs of an `infisical export --format json` output; empty when it is not that shape. */
function exportedPairs(output: string): Map<string, string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch {
    return new Map();
  }
  const pairs = new Map<string, string>();
  const entries: readonly ExportedSecret[] = Array.isArray(parsed)
    ? (parsed as ExportedSecret[])
    : typeof parsed === "object" && parsed !== null
      ? Object.entries(parsed).map(([key, value]) => ({ key, value }))
      : [];
  for (const { key, value } of entries)
    if (typeof key === "string" && typeof value === "string") pairs.set(key, value);
  return pairs;
}

/**
 * The values of `member`'s declared secrets for `environment`, in memory only and in CI only.
 *
 * @param input.environment - the runway environment (`staging`).
 * @param input.member - the member folder name (`api`).
 * @param input.runways - the root and member runways (`readRunways`).
 * @param input.run - the command runner; `runCommand` by default.
 * @param input.ci - whether this is a CI job; `GITHUB_ACTIONS === "true"` by default.
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
}): Promise<ReadonlyMap<string, string>> {
  const { environment, member, runways } = input;
  if (!(input.ci ?? process.env["GITHUB_ACTIONS"] === "true"))
    throw new RunwayUnresolvedError(
      `secret values are read only in a CI deploy job (GITHUB_ACTIONS=true); run the sync with --dry-run here to see the names`,
    );
  const entry = secretSyncPlan(environment, runways).find((item) => item.member === member);
  if (entry === undefined) return new Map();
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
  let output: string;
  try {
    output = await (input.run ?? runCommand)(
      "infisical",
      [
        "export",
        "--env",
        infisicalEnvironment,
        "--path",
        entry.path,
        "--projectId",
        infisical.workspace,
        "--format",
        "json",
        "--silent",
        ...(infisical.domain === undefined ? [] : ["--domain", infisical.domain]),
      ],
      {},
    );
  } catch {
    // No `cause` and no stderr: a failed export's output may hold values.
    throw new RunwayUnresolvedError(
      `infisical export of ${member}'s secrets (${where}) failed: check the job's Infisical login and that its identity may read ${entry.path}`,
    );
  }
  const pairs = exportedPairs(output);
  const missing = entry.names.filter((name) => !pairs.has(name));
  if (missing.length > 0)
    throw new RunwayUnresolvedError(
      `Infisical ${where} lacks ${member}'s ${missing.join(", ")}: the owner sets ${missing.length === 1 ? "it" : "them"} (runbooks/secrets)`,
    );
  return new Map(entry.names.map((name) => [name, pairs.get(name) ?? ""]));
}
