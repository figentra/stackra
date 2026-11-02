/**
 * Stackra file contract:
 * Purpose: `syncSecrets({ environment, runways, repository, dryRun, log })`, the secret sync of one environment
 *          (`runway secrets sync <env>`): prints each member's secret names, where Infisical holds them and who writes
 *          them, then, unless `dryRun`, reads every service's values (`readMemberSecrets`) and writes each into the
 *          Encore Cloud environment with `encore secret set --env <env> <NAME>`, the value on stdin. A Worker's secrets
 *          are the Workers provider's to set at deploy, a mobile app's wait for STA-2009, and other apps take none.
 * Boundary: names only in every line and every error; a value goes only to the runner's stdin. Every value is read
 *           before anything is written, so a missing name fails the sync with nothing changed. Encore secrets are
 *           app-wide: two services that name one secret must hold the same value, or nothing is written. The Encore
 *           environment is `environments.<env>.encore.environment`, else the runway environment's own name; the
 *           generated Encore app (`.stackra/encore`, `stackra gen`) is the working directory. Writes run only in CI
 *           (`readMemberSecrets` refuses elsewhere); a dry run reads nothing.
 * Runtime: node
 * Governing contract: ADR 0173; ADR 0512; ADR 0091 (the generated Encore app); runbooks/runway "Secrets and vars
 *                     sync"; STA-606; STA-2009; STA-1990.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { readMemberSecrets } from "#node/functions/read-member-secrets.function";
import { runProgram } from "#node/functions/run-program.function";
import { secretSyncPlan } from "#node/functions/secret-sync-plan.function";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { DeployRunways } from "#node/types/deploy-runways.type";
import type { SecretSyncEntry } from "#node/types/secret-sync-entry.type";

/** Where `stackra gen` writes the Encore app, from the repository root (ADR 0091). */
const ENCORE_APP = ".stackra/encore";

/** The names-only line of one member's secrets. */
function lineOf(entry: SecretSyncEntry, source: string, encoreEnvironment: string): string {
  const names = entry.names.join(", ");
  if (entry.writer === "encore")
    return `encore ${encoreEnvironment} ← ${source}:${entry.path ?? "(no runtime path)"}: ${names} (${entry.folder})`;
  if (entry.writer === "cloudflare-workers")
    return `cloudflare-workers ${entry.folder}: ${names}, set by the Workers provider at deploy`;
  if (entry.writer === "eas") return `eas ${entry.folder}: ${names}, not synced yet (STA-2009)`;
  return `none ${entry.folder}: ${names}, not synced: no runtime takes secrets from this member`;
}

/**
 * Syncs the runtime secrets of `environment`.
 *
 * @param input.environment - the runway environment (`staging`).
 * @param input.runways - the root and member runways (`readRunways`).
 * @param input.repository - the repository root.
 * @param input.dryRun - print the names and writers only; reads and writes nothing.
 * @param input.log - receives each line, names only.
 * @param input.run - the command runner; `runProgram` by default.
 * @param input.ci - whether this is a CI job; `GITHUB_ACTIONS === "true"` by default.
 * @throws RunwayUnresolvedError outside CI without `dryRun`, when a value is missing, when two services hold different
 *         values under one name, when the Encore app is not generated, or when a write fails; names only.
 * @example
 * await syncSecrets({ environment: "staging", runways, repository: root, dryRun: true, log: console.log });
 */
export async function syncSecrets(input: {
  readonly environment: string;
  readonly runways: DeployRunways;
  readonly repository: string;
  readonly dryRun: boolean;
  readonly log: (line: string) => void;
  readonly run?: CommandRunner | undefined;
  readonly ci?: boolean | undefined;
}): Promise<void> {
  const { environment, runways, log } = input;
  const run = input.run ?? runProgram;
  const plan = secretSyncPlan(environment, runways);
  const encoreEnvironment =
    runways.root.environments?.[environment]?.encore?.environment ?? environment;
  const source = `infisical ${runways.root.providers.infisical?.environments?.[environment] ?? "(unmapped)"}`;
  if (plan.length === 0) log(`no member declares a secret for ${environment}`);
  for (const entry of plan) log(lineOf(entry, source, encoreEnvironment));
  const services = plan.filter((entry) => entry.writer === "encore");
  if (input.dryRun || services.length === 0) return;

  // Read every value first: a missing name fails before anything is written.
  const values = new Map<string, { readonly value: string; readonly member: string }>();
  for (const { member } of services) {
    const read = await readMemberSecrets({ environment, member, runways, run, ci: input.ci });
    for (const [name, value] of read) {
      const held = values.get(name);
      if (held !== undefined && held.value !== value)
        throw new RunwayUnresolvedError(
          `${held.member} and ${member} hold different values for ${name}, but an Encore secret is app-wide: give them one value or two names`,
        );
      values.set(name, { value, member: held?.member ?? member });
    }
  }
  const cwd = join(input.repository, ENCORE_APP);
  if (!existsSync(cwd))
    throw new RunwayUnresolvedError(
      `${ENCORE_APP} does not exist: run \`stackra gen\` first, so the Encore secrets go to the generated app`,
    );
  for (const [name, { value }] of values) {
    try {
      await run("encore", ["secret", "set", "--env", encoreEnvironment, name], {
        cwd,
        input: value,
      });
    } catch {
      // No `cause` and no stderr: the CLI's output is not ours to print next to a value.
      throw new RunwayUnresolvedError(
        `encore secret set ${name} in ${encoreEnvironment} failed: check the job's Encore login and that ${encoreEnvironment} is an environment of the app`,
      );
    }
    log(`set ${name} in encore ${encoreEnvironment}`);
  }
}
