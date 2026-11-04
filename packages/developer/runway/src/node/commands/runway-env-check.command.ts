/**
 * Stackra file contract:
 * Purpose: `RunwayEnvCheckCommand`, `runway env check [--values --env <env> [--project-id <id>]]`
 *          (`runway env:check`): without `--values`, the names-only check (`checkEnv`) of the repository; with it, the
 *          CI-only value check (`checkEnvValues`) of `--env` (errors) and its sibling non-production environments
 *          (warnings). Exits 1 on an error; warnings pass.
 * Boundary: names only. The names check needs no login; the value check runs only in a CI job its GitHub OIDC token
 *           proves, and prints each name, its home, pass or the broken rule, and at most a SHA-256 prefix, never a
 *           value. The Quality Gate runs the names check on every pull request; a deploy job runs `--values`.
 * Runtime: node
 * Governing contract: ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import { Command, Option, type CommandIo } from "@stackra/console";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { checkEnv } from "#node/functions/check-env.function";
import { checkEnvValues } from "#node/functions/check-env-values.function";
import { repositoryRoot } from "#node/functions/repository-root.function";

/** Checks the repository's environment names, or one environment's values in CI. */
export class RunwayEnvCheckCommand extends Command({
  name: "env:check",
  description:
    "Check that every environment name is declared and has an Infisical home; --values checks an environment's values in CI",
  examples: ["runway env check", "runway env check --values --env staging --project-id <id>"],
}) {
  /** Check the values of `--env` (CI only). */
  @Option({ description: "Check the values of --env in Infisical (CI only; never prints a value)" })
  values = false;

  /** The environment whose values are checked. */
  @Option({
    description: "The runway environment the job deploys (dev, preview, staging, production)",
  })
  env?: string;

  /** The runtime Infisical project id; `providers.infisical.workspace` by default. */
  @Option({ description: "The Infisical project id of the environment's runtime project" })
  projectId?: string;

  /** The names check; a test replaces it. */
  check: typeof checkEnv = checkEnv;

  /** The value check; a test replaces it. */
  checkValues: typeof checkEnvValues = checkEnvValues;

  /**
   * Prints each finding and resolves with 1 when one is an error, else 0.
   *
   * @throws RunwayUnresolvedError for `--values` without `--env`, outside a proved CI job, or with no project id.
   */
  async handle(io: CommandIo): Promise<number> {
    const root = repositoryRoot(io.cwd);
    if (!this.values) {
      const findings = this.check(root);
      for (const { level, name, where, message } of findings) {
        const line = `${name} (${where}) ${message}`;
        if (level === "error") io.output.error(line);
        else io.output.warn(line);
      }
      const errors = findings.filter((finding) => finding.level === "error").length;
      if (errors === 0) io.output.success(`env names: no errors, ${findings.length} warnings`);
      return errors === 0 ? 0 : 1;
    }
    if (this.env === undefined)
      throw new RunwayUnresolvedError("--values needs --env <environment>");
    const results = await this.checkValues({
      root,
      environment: this.env,
      projectId: this.projectId,
    });
    for (const { level, environment, name, where, failure, hash } of results) {
      const line = `${environment} ${name} (${where}) ${failure === undefined ? "pass" : `fail: ${failure}`}${hash === undefined ? "" : ` sha256:${hash}`}`;
      if (failure === undefined) io.output.line(line);
      else if (level === "error") io.output.error(line);
      else io.output.warn(line);
    }
    const errors = results.filter(
      (result) => result.failure !== undefined && result.level === "error",
    ).length;
    if (errors === 0) io.output.success(`env values of ${this.env}: all pass`);
    return errors === 0 ? 0 : 1;
  }
}
