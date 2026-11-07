/**
 * Stackra file contract:
 * Purpose: `RunwayEvidenceCommand`, `runway evidence <environment> --target <t> --sha <sha> [--member <m>] [--repo <r>]`:
 *          writes the approvals bot's evidence for one deploy job (`deployEvidence`, ADR 0533) to
 *          `runway-evidence-<environment>[-<member>].json` in the working folder, the name the bot looks for in the
 *          run's artifacts, and gives it as the `--json` data.
 * Boundary: reads the runway files only; writes that one file and nothing else; no network and no value. The repo is
 *           the root runway's `providers.github` unless `--repo` names it.
 * Runtime: node
 * Governing contract: ADR 0533 (decision 3); ADR 0352 (decision 6); ADR 0506 (decision 8); STA-2104.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { Argument, Command, Option, UsageError, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { RunwayKind } from "#core/enums/runway-kind.enum";
import { deployEvidence } from "#core/functions/deploy-evidence.function";
import type { DeployEvidence } from "#core/types/deploy-evidence.type";
import { readRunway } from "#node/functions/read-runway.function";
import { repositoryRoot } from "#node/functions/repository-root.function";

/** Writes one deploy job's evidence for the approvals bot. */
export class RunwayEvidenceCommand extends Command({
  name: "evidence",
  bin: true,
  description:
    "Write the approvals bot's evidence for one deploy job (rollout, destructive migrations)",
  examples: [
    "runway evidence production --target cloudflare-workers --member docs --sha <sha>",
    "runway evidence production --target encore-cloud --sha <sha> --json",
  ],
}) {
  /** The environment the job deploys. */
  @Argument({ description: "The runway environment the job deploys" })
  environment!: string;

  /** The destination target. */
  @Option({
    description: "The target, a key of runway.yaml `targets` (for example cloudflare-workers)",
  })
  @Str
  target?: string;

  /** The commit the job deploys. */
  @Option({ description: "The full commit SHA the job deploys" })
  @Str
  sha?: string;

  /** The member, when the job ships one. */
  @Option({ description: "The member the job ships (default: the whole target)" })
  @Str
  member?: string;

  /** The repository, when the root runway does not name it. */
  @Option({ description: "owner/repo (default: the root runway's providers.github)" })
  @Str
  repo?: string;

  /**
   * Writes the file and resolves with the evidence.
   *
   * @throws UsageError without `--target`, without a full `--sha`, or with no repository to name.
   */
  handle(io: CommandIo): DeployEvidence {
    if (this.target === undefined)
      throw new UsageError("--target is required", "Name the target the job deploys");
    if (this.sha === undefined || !/^[0-9a-f]{40}$/.test(this.sha))
      throw new UsageError(
        "--sha must be a full commit SHA",
        "Pass the 40-character commit the job deploys",
      );
    const runway = readRunway(join(repositoryRoot(io.cwd), "runway.yaml"), RunwayKind.Root);
    const github = runway.providers?.github;
    const repo = this.repo ?? (github === undefined ? undefined : `${github.org}/${github.repo}`);
    if (repo === undefined)
      throw new UsageError(
        "no repository to name",
        "Pass --repo or set providers.github in runway.yaml",
      );
    const evidence = deployEvidence(runway, {
      repo,
      environment: this.environment,
      sha: this.sha,
      target: this.target,
      member: this.member,
    });
    const name = `runway-evidence-${this.environment}${this.member === undefined ? "" : `-${this.member}`}.json`;
    writeFileSync(join(io.cwd, name), `${JSON.stringify(evidence, null, 2)}\n`);
    io.output.success(
      `${name}: rollout ${String(evidence.rollout)}, destructive ${String(evidence.destructive)}`,
    );
    return evidence;
  }
}
