/**
 * Stackra file contract:
 * Purpose: `runRunwayPromote(context)`, the run of `stackra promote --to <environment> [--from <environment>]
 *          [--sha <sha>] [--dry-run] [--approved]` at a repository root: moves the commit `--from` (default `staging`)
 *          runs, or `--sha`, to every target of `--to` through Runway's `promote()` and its providers. `--to` must
 *          declare `deploy.on: promote`. A dry run lists the targets and changes nothing. An environment whose runway
 *          declares `deploy.approval` is promoted only with `--approved`, and one apply of an environment runs at a
 *          time on a host (`withDeployLock` over `fileDeployLock`), as in `stackra deploy --env` (ADR 0468).
 * Boundary: the CLI picks the providers and prints; every change is a provider's. A product's own surfaces and mobile
 *           builds are not moved here: `promote()` ships through providers only.
 * Runtime: node
 * Governing contract: ADR 0170 (decisions 6 and 10); ADR 0352 (decisions 1 and 3); ADR 0468; STA-607.
 */
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildConfig } from "@stackra/config";
import {
  deployTargets,
  promote,
  RunwayConfig,
  RunwayEnvironment,
  withDeployLock,
} from "@stackra/runway";
import {
  CloudflareWorkersProviderDriver,
  EasProviderDriver,
  EncoreCloudProviderDriver,
  fileDeployLock,
  MintlifyProviderDriver,
  readRunway,
} from "@stackra/runway/node";

import { CliUsageError } from "#node/errors/cli-usage.error";
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
  if (values["dry-run"] === true) {
    for (const target of deployTargets(root, to as RunwayEnvironment))
      io.out(`${target.id} → ${target.destination}\n`);
    return 0;
  }
  // ADR 0468: an environment with an approval ships only from the job behind it, which passes --approved.
  const approval = root.environments[to as RunwayEnvironment]?.deploy?.approval;
  if (approval !== undefined && values["approved"] !== true)
    throw new CliUsageError(
      `${to} is promoted only after its approval (${approval}): run the promotion in the job behind it and pass --approved`,
    );

  const encoreApp = root.providers?.encore?.app;
  const config = buildConfig(RunwayConfig, {
    values: encoreApp === undefined ? {} : { encoreApp },
  });
  const providers = [
    ...(encoreApp === undefined ? [] : [new EncoreCloudProviderDriver(config)]),
    new EasProviderDriver(config),
    new MintlifyProviderDriver(config),
    Object.assign(new CloudflareWorkersProviderDriver(), { root: cwd, only: [] }),
  ];
  const sha = typeof values["sha"] === "string" ? values["sha"] : undefined;
  const results = await withDeployLock(root, to as RunwayEnvironment, fileDeployLock(LOCKS), () =>
    promote(root, from as RunwayEnvironment, to as RunwayEnvironment, providers, sha),
  );
  for (const { record, report } of results)
    io.out(
      `${record.target} ${record.sha.slice(0, 12)} ${report.status}${record.reference === "" ? "" : ` (${record.reference})`}\n`,
    );
  return 0;
}
