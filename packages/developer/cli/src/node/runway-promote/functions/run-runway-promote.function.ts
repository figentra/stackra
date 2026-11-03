/**
 * Stackra file contract:
 * Purpose: `runRunwayPromote(context)`, the run of `stackra promote --to <environment> [--from <environment>]
 *          [--sha <sha>] [--dry-run] [--approved]` at a repository root: moves the commit `--from` (default `staging`)
 *          runs, or `--sha`, to every target of `--to` through Runway's `promote()` and its providers. `--to` must
 *          declare `deploy.on: promote`, checked before a dry run too. A dry run lists the targets, marking one no
 *          provider serves, and changes nothing. An environment whose runway
 *          declares `deploy.approval` is promoted only with `--approved`, and one apply of an environment runs at a
 *          time on a host (`withDeployLock` over `fileDeployLock`), as in `stackra deploy --env` (ADR 0468).
 * Boundary: the CLI picks the providers and prints; every change is a provider's. A product's own surfaces and mobile
 *           builds are not moved here: `promote()` ships through providers only.
 * Runtime: node
 * Governing contract: ADR 0170 (decisions 6 and 10); ADR 0352 (decisions 1 and 3); ADR 0468; STA-607.
 */
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  deployTargets,
  promote,
  RunwayEnvironment,
  RunwayInvalidError,
  withDeployLock,
} from "@stackra/runway";
import { fileDeployLock, readRunway } from "@stackra/runway/node";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { printDeployResults } from "#node/runway-deploy/functions/print-deploy-results.function";
import { runwayProviders } from "#node/runway-deploy/functions/runway-providers.function";
import type { CliContext } from "#node/types/cli-context.type";

/** Where the deploy locks of this host live (shared with `stackra deploy`, so the two exclude each other). */
const LOCKS = join(tmpdir(), "stackra-runway-locks");

/**
 * Promotes between two environments and resolves with the exit code.
 *
 * @throws CliUsageError when `--to` or `--from` is missing or unknown.
 * @throws CliUsageError when `--to` declares an approval and `--approved` is not passed.
 * @throws RunwayInvalidError when `--to` does not deploy on promotion.
 * @throws RunwayLockedError when another apply of `--to` holds this host's lock.
 * @example
 * await runRunwayPromote({ ...context, values: { from: "staging", to: "production", approved: true } });
 */
export async function runRunwayPromote(context: CliContext): Promise<number> {
  const { cwd, io, values } = context;
  const environments = Object.values(RunwayEnvironment) as string[];
  const to = values["to"];
  const from = values["from"] ?? RunwayEnvironment.Staging;
  if (typeof to !== "string" || !environments.includes(to))
    throw new CliUsageError(`name the environment: --to <${environments.join("|")}>`);
  if (typeof from !== "string" || !environments.includes(from))
    throw new CliUsageError(`--from must be one of ${environments.join(", ")}`);

  const root = readRunway(join(cwd, "runway.yaml"), "root");
  // Checked before the dry run too, so the preview refuses what the real run would (`promote()` checks it again).
  if (root.environments[to as RunwayEnvironment]?.deploy?.on !== "promote")
    throw new RunwayInvalidError("runway.yaml", [
      {
        path: `environments.${to}.deploy.on`,
        message: `${to} is not deployed by promotion: set \`deploy.on: promote\``,
      },
    ]);
  const providers = runwayProviders(root, cwd);
  if (values["dry-run"] === true) {
    for (const target of deployTargets(root, to as RunwayEnvironment)) {
      const provider = providers.find((candidate) => candidate.destination === target.destination);
      io.out(
        `${target.id} → ${target.destination}${provider === undefined ? " (no provider)" : ""}\n`,
      );
    }
    return 0;
  }
  // ADR 0468: an environment with an approval ships only from the job behind it, which passes --approved.
  const approval = root.environments[to as RunwayEnvironment]?.deploy?.approval;
  if (approval !== undefined && values["approved"] !== true)
    throw new CliUsageError(
      `${to} is promoted only after its approval (${approval}): run the promotion in the job behind it and pass --approved`,
    );

  const sha = typeof values["sha"] === "string" ? values["sha"] : undefined;
  const results = await withDeployLock(root, to as RunwayEnvironment, fileDeployLock(LOCKS), () =>
    promote(root, from as RunwayEnvironment, to as RunwayEnvironment, providers, sha),
  );
  printDeployResults(io, results);
  return 0;
}
