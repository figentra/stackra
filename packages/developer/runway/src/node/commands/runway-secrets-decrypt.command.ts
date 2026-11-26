/**
 * Stackra file contract:
 * Purpose: `RunwaySecretsDecryptCommand`, `runway secrets decrypt --scope <scope> [--dir <dir>] [--names A,B]`
 *          (`runway secrets:decrypt`): one figentra/secrets scope's values, decrypted with the job's own Cloud KMS
 *          identity from the ciphertext the shared action downloaded (`decryptScope`), masked and exported into the
 *          job's `GITHUB_ENV` (`exportToGithubEnv`) for the steps after it.
 * Boundary: prints names and a count, never a value; refuses to run where there is no `GITHUB_ENV`. Which job may
 *           decrypt a scope is Cloud KMS's, pinned per repository, environment and workflow by figentra/infra.
 * Runtime: node
 * Governing contract: ADR 0525 (CI decrypts in place); ADR 0257; ADR 0506 (decision 8).
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { decryptScope } from "#node/functions/decrypt-scope.function";
import { exportToGithubEnv } from "#node/functions/export-to-github-env.function";

/** Decrypts one scope into the job's environment. */
export class RunwaySecretsDecryptCommand extends Command({
  name: "secrets:decrypt",
  bin: true,
  description:
    "Decrypt one figentra/secrets scope into this GitHub Actions job's environment (masked; never printed)",
  examples: [
    "runway secrets decrypt --scope ci/build/registry --names STACKRA_REGISTRY_TOKEN",
    "runway secrets decrypt --scope ci/deploy --dir .secrets",
  ],
}) {
  /** The scope: agents, ci/<build|deploy|production|flow>[/folder] or products/<product>/<env>. */
  @Option({ description: "The figentra/secrets scope to decrypt" })
  @Str
  scope?: string;

  /** Where the shared action downloaded the ciphertext. */
  @Option({ description: "The folder holding <scope>/<NAME>.enc.yaml (default .secrets)" })
  @Str
  dir = ".secrets";

  /** Only these names, comma-separated; every name of the scope by default. */
  @Option({ description: "Only these names, comma-separated (default: the whole scope)" })
  @Str
  names?: string;

  /** The decrypt; a test replaces it. */
  decrypt: typeof decryptScope = decryptScope;

  /** The export; a test replaces it. */
  export: typeof exportToGithubEnv = exportToGithubEnv;

  /** The job's environment, where the runner names its `GITHUB_ENV` file; a test replaces it. */
  env: Readonly<Record<string, string | undefined>> = process.env;

  /**
   * Decrypts, masks and exports; resolves with 0.
   *
   * @throws RunwayUnresolvedError without `--scope` or `GITHUB_ENV`, or when the scope cannot be decrypted.
   */
  async handle(io: CommandIo): Promise<number> {
    if (this.scope === undefined) throw new RunwayUnresolvedError("--scope is required");
    const envFile = this.env["GITHUB_ENV"];
    if (envFile === undefined || envFile === "")
      throw new RunwayUnresolvedError(
        "no GITHUB_ENV: secrets decrypt only writes into a GitHub Actions job's environment, never to output",
      );
    const names = this.names
      ?.split(",")
      .map((name) => name.trim())
      .filter((name) => name !== "");
    const values = await this.decrypt({
      dir: this.dir.startsWith("/") ? this.dir : `${io.cwd}/${this.dir}`,
      scope: this.scope,
      names,
    });
    const exported = this.export(values, { envFile });
    io.output.success(`${this.scope}: ${exported.length} exported (${exported.join(", ")})`);
    return 0;
  }
}
