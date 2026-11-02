/**
 * Stackra file contract:
 * Purpose: `runRunwayDeploy(context)`, the run of `stackra deploy --env <environment> [--kind <kind,…>]
 *          [--member <key,…>] [--sha <sha>] [--dry-run]` at a repository root: reads the root `runway.yaml` and ships
 *          the commit (the checked-out `HEAD` unless `--sha`) to every target of the environment through Runway's
 *          `deploy()` and its providers (`encore-cloud`, `eas`, `mintlify`, `cloudflare-workers`). `--kind` keeps the
 *          targets of those kinds, `--member` the named Worker members. A dry run prints each target's plan.
 * Boundary: the CLI picks the providers and prints; every change is a provider's. Logins are each provider CLI's own
 *           (OIDC in CI), and Worker ids, vars and secrets are read by the provider from this process's environment.
 * Runtime: node
 * Governing contract: ADR 0352 (decisions 1, 3 and 6); STA-1921.
 */
import { join } from "node:path";

import { buildConfig } from "@stackra/config";
import {
  deploy,
  deployTargets,
  DeployKind,
  RunwayConfig,
  RunwayEnvironment,
} from "@stackra/runway";
import {
  CloudflareWorkersProviderDriver,
  EasProviderDriver,
  EncoreCloudProviderDriver,
  MintlifyProviderDriver,
  readRunway,
  runCommand,
} from "@stackra/runway/node";

import { CliUsageError } from "#node/errors/cli-usage.error";
import type { CliContext } from "#node/types/cli-context.type";

/** A comma list; empty counts as missing. */
function list(value: string | boolean | undefined): string[] | undefined {
  const items =
    typeof value === "string"
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "")
      : [];
  return items.length === 0 ? undefined : items;
}

/**
 * Deploys the commit to the environment's targets and resolves with the exit code.
 *
 * @throws CliUsageError when the environment or a kind is missing or unknown.
 * @throws RunwayDeployFailedError at the first target that does not verify.
 * @example
 * await runRunwayDeploy({ ...context, values: { env: "production", kind: "web", member: "registry" } });
 */
export async function runRunwayDeploy(context: CliContext): Promise<number> {
  const { cwd, io, values } = context;
  const environment = values["env"];
  const environments = Object.values(RunwayEnvironment) as string[];
  if (typeof environment !== "string" || !environments.includes(environment))
    throw new CliUsageError(`name the environment: --env <${environments.join("|")}>`);
  const kinds = list(values["kind"]);
  const known = Object.values(DeployKind) as string[];
  const unknown = kinds?.filter((kind) => !known.includes(kind)) ?? [];
  if (unknown.length > 0)
    throw new CliUsageError(`unknown --kind ${unknown.join(", ")}: one of ${known.join(", ")}`);

  const root = readRunway(join(cwd, "runway.yaml"), "root");
  const encoreApp = root.providers?.encore?.app;
  const config = buildConfig(RunwayConfig, {
    values: encoreApp === undefined ? {} : { encoreApp },
  });
  const workers = Object.assign(new CloudflareWorkersProviderDriver(), {
    root: cwd,
    only: list(values["member"]) ?? [],
  });
  // A repository without an Encore app (core) has no `encore-cloud` provider; a target naming it fails in `deploy()`.
  const providers = [
    ...(encoreApp === undefined ? [] : [new EncoreCloudProviderDriver(config)]),
    new EasProviderDriver(config),
    new MintlifyProviderDriver(config),
    workers,
  ];
  const sha =
    typeof values["sha"] === "string"
      ? values["sha"]
      : (await runCommand("git", ["rev-parse", "HEAD"], { cwd })).trim();
  const only = kinds as DeployKind[] | undefined;

  if (values["dry-run"] === true) {
    for (const target of deployTargets(root, environment as RunwayEnvironment)) {
      if (only !== undefined && !only.includes(target.kind)) continue;
      const provider = providers.find((candidate) => candidate.destination === target.destination);
      io.out(
        `${target.id} → ${target.destination}${provider === undefined ? " (no provider)" : ""}\n`,
      );
      for (const step of provider?.plan(target, sha) ?? [])
        io.out(`  ${step.cwd ?? "."}$ ${[step.command, ...step.args].join(" ")}\n`);
    }
    return 0;
  }

  const results = await deploy(root, environment as RunwayEnvironment, sha, providers, only);
  for (const { record, report } of results)
    io.out(
      `${record.target} ${record.sha.slice(0, 12)} ${report.status}${record.reference === "" ? "" : ` (${record.reference})`}\n`,
    );
  return 0;
}
