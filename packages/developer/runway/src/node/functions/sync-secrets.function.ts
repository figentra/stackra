/**
 * Stackra file contract:
 * Purpose: `syncSecrets({ environment, runways, repository, dryRun, log })`, the secret sync of one environment
 *          (`runway secrets sync <env>`): prints each member's secret names, the sops scope that holds them and who
 *          writes them, then, unless `dryRun`, reads every service's values from the job's environment, where the
 *          shared `secrets-decrypt` action put the scope (`readMemberSecrets`, ADR 0525), and writes each into the
 *          Encore Cloud environment with `encore secret set --env <env> <NAME>`, the value on stdin. A Worker's secrets
 *          are the Workers provider's to set at deploy, a mobile app's wait for STA-2009, and other apps take none.
 * Boundary: names only in every line and every error; a value goes only to the runner's stdin. Every value is read
 *           before anything is written, so a missing name fails the sync with nothing changed. An optional name the
 *           scope lacks is written as an empty placeholder, so Encore still provisions the service, only when
 *           `encore secret list` shows Encore holds no value for it in the environment (`encoreHeldSecrets`); a value
 *           set by hand is kept, and when the listing cannot be read no placeholder is written; an optional config
 *           name the scope lacks is never written, so its config default applies (STA-258). Encore secrets are
 *           app-wide, and the job's environment holds one value per name, so two services that name one secret share
 *           it: a name any service reads as optional config with a default is never written empty, even when another
 *           service declares it an optional secret, so that placeholder never overrides the default. The Encore
 *           environment is `environments.<env>.encore.environment`, else the runway environment's own name. The
 *           writes run in a temporary folder holding only `encore.app` with the root runway's `providers.encore.app`, so
 *           they reach the app whatever the generated layout (a service member's `stackra-encore`, or the deploy
 *           commit's root, STA-2193). Writes run only in CI
 *           (`readMemberSecrets` refuses elsewhere); a dry run reads nothing.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0091 (the generated Encore app); runbooks/runway "Secrets and vars sync";
 *                     STA-606; STA-2009; STA-1990.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { encoreHeldSecrets } from "#node/functions/encore-held-secrets.function";
import { readMemberSecrets } from "#node/functions/read-member-secrets.function";
import { runProgram } from "#node/functions/run-program.function";
import { secretSyncPlan } from "#node/functions/secret-sync-plan.function";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { DeployRunways } from "#node/types/deploy-runways.type";
import type { SecretSyncEntry } from "#node/types/secret-sync-entry.type";

/** The names-only line of one member's secrets; optional secrets and optional config names are marked. */
function lineOf(entry: SecretSyncEntry, encoreEnvironment: string): string {
  const placeholders = new Set(entry.placeholders ?? []);
  const defaults = new Set(entry.defaults ?? []);
  const names = entry.names
    .map((name) =>
      placeholders.has(name)
        ? `${name} (optional)`
        : defaults.has(name)
          ? `${name} (optional, has a default)`
          : name,
    )
    .join(", ");
  if (entry.writer === "encore")
    return `encore ${encoreEnvironment} ← sops ${entry.scope ?? "(no project, no scope)"}: ${names} (${entry.folder})`;
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
 * @param input.ci - a test's answer to "is this a proved CI job"; by default the GitHub OIDC token answers it.
 * @param input.env - the job's environment the values are read from; `process.env` by default.
 * @throws RunwayUnresolvedError outside CI without `dryRun`, when a value is missing, when the Encore app is not
 *         named, or when a write fails; names only.
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
  /** The job's environment, holding the decrypted sops scope; a test replaces it. */
  readonly env?: Readonly<Record<string, string | undefined>> | undefined;
}): Promise<void> {
  const { environment, runways, log } = input;
  const run = input.run ?? runProgram;
  const plan = secretSyncPlan(environment, runways);
  const encoreEnvironment =
    runways.root.environments?.[environment]?.encore?.environment ?? environment;
  if (plan.length === 0) log(`no member declares a secret for ${environment}`);
  for (const entry of plan) log(lineOf(entry, encoreEnvironment));
  const services = plan.filter((entry) => entry.writer === "encore");
  if (input.dryRun || services.length === 0) return;

  // Read every value first: a missing name fails before anything is written.
  // One environment holds one value per name, so two services naming one secret share it (Encore secrets are app-wide).
  const values = new Map<string, string>();
  for (const { member } of services) {
    const read = await readMemberSecrets({
      environment,
      member,
      runways,
      ci: input.ci,
      env: input.env,
    });
    for (const [name, value] of read) values.set(name, value);
  }
  // An optional config name with no value in the scope is left as it is in Encore: an empty value would override
  // its default. Secrets are app-wide, so that holds when another service declares the name an optional secret too.
  const defaulted = new Set(services.flatMap((entry) => entry.defaults ?? []));
  const unset = [...defaulted].filter((name) => (values.get(name) ?? "") === "").toSorted();
  for (const name of unset) values.delete(name);
  const app = runways.root.providers.encore?.app;
  if (app === undefined)
    throw new RunwayUnresolvedError(
      "Name the Encore app at providers.encore.app in the root runway: the Encore secrets are written into that app",
    );
  // `encore secret set` finds its app through `encore.app` in its working directory; nothing else is needed there.
  const cwd = mkdtempSync(join(tmpdir(), "runway-encore-secrets-"));
  writeFileSync(join(cwd, "encore.app"), `${JSON.stringify({ id: app, lang: "typescript" })}\n`);
  try {
    // An empty value is an optional name the scope lacks: ask Encore first, so a value it holds is never emptied.
    const empty = [...values].some(([, value]) => value === "");
    let held: ReadonlySet<string> | null = new Set();
    if (empty) {
      try {
        held = encoreHeldSecrets(
          await run("encore", ["secret", "list"], { cwd }),
          encoreEnvironment,
        );
      } catch {
        held = null;
      }
    }
    for (const name of unset)
      log(
        `left ${name} in encore ${encoreEnvironment} as it is: optional config with no value in the scope, so its default applies`,
      );
    for (const [name, value] of values) {
      if (value === "" && (held === null || held.has(name))) {
        log(
          held === null
            ? `left ${name} in encore ${encoreEnvironment} as it is: optional, no value in the scope, and encore secret list could not be read`
            : `kept ${name} in encore ${encoreEnvironment}: optional, no value in the scope, and Encore already holds one`,
        );
        continue;
      }
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
      log(
        value === ""
          ? `set ${name} in encore ${encoreEnvironment} as an empty placeholder (optional, no value in the scope)`
          : `set ${name} in encore ${encoreEnvironment}`,
      );
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}
