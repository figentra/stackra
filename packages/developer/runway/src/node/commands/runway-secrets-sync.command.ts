/**
 * Stackra file contract:
 * Purpose: `RunwaySecretsSyncCommand`, `runway secrets sync <env> [--dry-run]` (`runway secrets:sync`): the member
 *          secrets of `env` from Infisical into the runtimes (`syncSecrets`). A real sync runs only in a GitHub
 *          Actions job its OIDC token proves (STA-2100); `--dry-run` prints the names and writers anywhere.
 * Boundary: names only; values stay in memory inside `syncSecrets`.
 * Runtime: node
 * Governing contract: ADR 0173; ADR 0506 (decision 8); STA-606; STA-2100.
 */
import { Argument, Command, Option, type CommandIo } from "@stackra/console";

import { readRunways } from "#node/functions/read-runways.function";
import { repositoryRoot } from "#node/functions/repository-root.function";
import { syncSecrets } from "#node/functions/sync-secrets.function";

/** Syncs an environment's member secrets. */
export class RunwaySecretsSyncCommand extends Command({
  name: "secrets:sync",
  description: "Sync an environment's member secrets from Infisical into the runtimes (CI only)",
  examples: ["runway secrets sync staging --dry-run"],
}) {
  /** The environment whose secrets sync. */
  @Argument({ description: "The environment (dev, preview, staging, production)" })
  environment!: string;

  /** Print the names and writers only. */
  @Option({ description: "Print the secret names and writers; read and write nothing" })
  dryRun = false;

  /**
   * Syncs and resolves with 0.
   *
   * @throws RunwayUnresolvedError outside a proved CI job (unless a dry run), or when a value is missing.
   */
  async handle(io: CommandIo): Promise<number> {
    const root = repositoryRoot(io.cwd);
    await syncSecrets({
      environment: this.environment,
      runways: readRunways(root),
      repository: root,
      dryRun: this.dryRun,
      log: (line) => io.output.line(line),
    });
    return 0;
  }
}
