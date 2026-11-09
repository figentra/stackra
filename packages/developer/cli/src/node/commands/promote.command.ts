/**
 * Stackra file contract:
 * Purpose: `PromoteCommand`, `stackra promote --to <environment> [--from <environment>] [--sha <sha>] [--dry-run]
 *          [--approved]` at a repository root: moves the commit `--from` (default `staging`) runs, or `--sha`, to
 *          every target of `--to` through Runway's `promote()` and its providers (`runwayProviders`). `--to` must
 *          declare `deploy.on: promote`, checked before a dry run too. A dry run draws the targets as a table (its rows
 *          are the `--json` data), noting one no provider serves, and changes nothing. An environment whose runway
 *          declares `deploy.approval` is promoted only from the job behind it, proved by its GitHub OIDC token
 *          (`proveApproval`, exit 2 without it; `--approved` is parsed and proves nothing), and one apply of an
 *          environment runs at a time on a host (`withDeployLock` over `fileDeployLock`, shared with `stackra deploy`),
 *          as in `stackra deploy --env` (ADR 0468). The shipped targets are drawn as a table too.
 * Boundary: the CLI picks the providers and prints; every change is a provider's. A product's own surfaces and mobile
 *           builds are not moved here: `promote()` ships through providers only. Not an MCP tool: it deploys.
 * Runtime: node
 * Governing contract: ADR 0170 (decisions 6 and 10); ADR 0352 (decisions 1 and 3); ADR 0468; ADR 0506; STA-607;
 *                     STA-1966.
 */
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Command, Option, UsageError, type CommandIo } from "@stackra/console";
import { Enum } from "@stackra/contracts";
import {
  deployTargets,
  promote,
  RunwayEnvironment,
  RunwayInvalidError,
  withDeployLock,
} from "@stackra/runway";
import { fileDeployLock, readRunway } from "@stackra/runway/node";
import { Str } from "@stackra/validation";

import { proveApproval } from "#node/runway-deploy/functions/prove-approval.function";
import { runwayProviders } from "#node/runway-deploy/functions/runway-providers.function";

/** Where the deploy locks of this host live (shared with `stackra deploy`, so the two exclude each other). */
const LOCKS = join(tmpdir(), "stackra-runway-locks");

/** The environments a runway names. */
const ENVIRONMENTS: readonly string[] = Enum.values(RunwayEnvironment).map(String);

/** Ships what one environment runs to the next. */
export class PromoteCommand extends Command({
  name: "promote",
  description: "Ship the commit one environment runs to the next, through runway's providers",
  bin: true,
  examples: [
    "stackra promote --to production --dry-run",
    "stackra promote --to production --sha <sha>",
  ],
}) {
  /** The environment to ship to. */
  @Option({
    description: "The environment to ship to (required)",
    choices: ENVIRONMENTS,
  })
  to?: string;

  /** The environment whose commit ships. */
  @Option({
    description: "The environment whose commit ships",
    choices: ENVIRONMENTS,
  })
  from: string = RunwayEnvironment.Staging;

  /** The commit, instead of the one `--from` runs. */
  @Option({ description: "Ship this commit instead of the one --from runs" })
  @Str
  sha?: string;

  /** List the targets only. */
  @Option({ description: "List the targets and change nothing" })
  dryRun = false;

  /** Still parsed so older jobs run; it proves nothing (the job's OIDC token does, STA-2100). */
  @Option({ description: "Ignored: the job's GitHub OIDC token proves --to's approval (ADR 0468)" })
  approved = false;

  /**
   * Promotes and resolves with the exit code.
   *
   * @throws UsageError when `--to` is missing, or declares an approval the job's OIDC token does not prove.
   * @throws RunwayInvalidError when `--to` does not deploy on promotion.
   * @throws RunwayLockedError when another apply of `--to` holds this host's lock.
   */
  async handle(io: CommandIo): Promise<number> {
    if (this.to === undefined)
      throw new UsageError(
        "name the environment: --to <environment>",
        `Pass one of: ${ENVIRONMENTS.join(", ")}`,
      );
    const to = this.to as RunwayEnvironment;
    const root = readRunway(join(io.cwd, "runway.yaml"), "root");
    // Checked before the dry run too, so the preview refuses what the real run would (`promote()` checks it again).
    if (root.environments[to]?.deploy?.on !== "promote")
      throw new RunwayInvalidError("runway.yaml", [
        {
          path: `environments.${to}.deploy.on`,
          message: `${to} is not deployed by promotion: set \`deploy.on: promote\``,
        },
      ]);
    const providers = runwayProviders(root, io.cwd);
    if (this.dryRun) {
      io.output.table({
        title: `${this.from} → ${to}`,
        columns: [
          { header: "Target", key: "target" },
          { header: "Destination", key: "destination" },
          { header: "Note", key: "note" },
        ],
        rows: deployTargets(root, to).map((target) => ({
          target: target.id,
          destination: target.destination,
          ...(providers.some((provider) => provider.destination === target.destination)
            ? {}
            : { note: "no provider" }),
        })),
      });
      return 0;
    }
    // ADR 0468: an environment with an approval ships only from the job behind it, proved by its OIDC token.
    await proveApproval(root, to, "is promoted");

    const results = await withDeployLock(root, to, fileDeployLock(LOCKS), () =>
      promote(root, this.from as RunwayEnvironment, to, providers, this.sha),
    );
    io.output.table({
      columns: [
        { header: "Target", key: "target" },
        { header: "Commit", key: "sha" },
        { header: "Status", key: "status" },
        { header: "Reference", key: "reference" },
      ],
      rows: results.map(({ record, report }) => ({
        target: record.target,
        sha: record.sha.slice(0, 12),
        status: report.status,
        ...(record.reference === "" ? {} : { reference: record.reference }),
      })),
    });
    return 0;
  }
}
