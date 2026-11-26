/**
 * Stackra file contract:
 * Purpose: `ContractCommand`, `stackra contract [--base <ref>] [--oasdiff <path>] [--today YYYY-MM-DD]`: the
 *          `oasdiff` check of the contract tier. Every workspace member's HTTP contract (the OpenAPI projection of its
 *          `stackra.manifest.json`) is compared with the same member at the merge base of `HEAD` and `--base`
 *          (`origin/main` by default; CI passes `HEAD~1`, the base branch of the pull request's merge commit), and each
 *          breaking change `tools/contract/accepted-breaks.yaml` does not excuse is a failed checklist row named by
 *          the member folder (the findings are the `--json` data). Any finding exits 1.
 * Boundary: the check is `contractFindings`; this resolves the base commit with `git merge-base` and the run date.
 *           Writes nothing in the workspace. Needs `oasdiff` on PATH (mise.toml pins it) or `--oasdiff`.
 * Runtime: node
 * Governing contract: ADR 0182 (decisions 1 and 4: the contract tier and its `oasdiff` checks); ADR 0158; ADR 0506;
 *                     STA-2837.
 */
import { execFileSync } from "node:child_process";

import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { contractFindings } from "#node/contract/functions/contract-findings.function";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { reportFindings } from "#node/functions/report-findings.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** Fails on a breaking change to a member's HTTP contract since the base commit. */
export class ContractCommand extends Command({
  name: "contract",
  description:
    "Fail on a breaking change to any member's HTTP contract (oasdiff on the manifests) since the base commit",
  bin: true,
}) {
  /** The ref whose merge base with HEAD is the baseline. */
  @Option({
    description: "Compare with the merge base of HEAD and this ref (default: origin/main)",
  })
  @Str
  base?: string;

  /** The oasdiff binary. */
  @Option({ description: "The oasdiff binary (default: oasdiff on PATH)" })
  @Str
  oasdiff?: string;

  /** The date accepted breaks expire against. */
  @Option({ description: "The date accepted breaks are judged on, YYYY-MM-DD (default: today)" })
  @Str
  today?: string;

  /**
   * Reports every unexcused breaking change.
   *
   * @throws CliUsageError when `--today` is not a date or git finds no merge base with `--base`.
   */
  async handle(io: CommandIo): Promise<number> {
    const root = workspaceRoot(io.cwd);
    const today = this.today ?? new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new CliUsageError("--today must be YYYY-MM-DD");
    const ref = this.base ?? "origin/main";
    let base: string;
    try {
      base = execFileSync("git", ["merge-base", "HEAD", ref], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim();
    } catch {
      throw new CliUsageError(
        `no merge base of HEAD and ${ref}: fetch it (a shallow clone needs fetch-depth 0) or pass --base <ref>`,
      );
    }
    const findings = await contractFindings(root, base, {
      today,
      ...(this.oasdiff === undefined ? {} : { oasdiff: this.oasdiff }),
    });
    return reportFindings(
      io,
      findings,
      `no breaking change to any member's HTTP contract since ${ref} (${base.slice(0, 10)})`,
    );
  }
}
