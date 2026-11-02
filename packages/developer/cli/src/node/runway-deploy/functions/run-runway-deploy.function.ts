/**
 * Stackra file contract:
 * Purpose: `runRunwayDeploy(context)`, the run of `stackra deploy --env <environment> [--kind <kind,…>]
 *          [--member <key,…>] [--sha <sha>] [--dry-run]` at a repository root: reads the root `runway.yaml` and ships
 *          the commit (the checked-out `HEAD` unless `--sha`) to every target of the environment through Runway's
 *          `deploy()` and its providers (`encore-cloud`, `eas`, `mintlify`, `cloudflare-workers`). `--kind` keeps the
 *          targets of those kinds, `--member` the named Worker members. A dry run prints each target's plan. An
 *          environment whose runway declares `deploy.approval` ships only with `--approved` (ADR 0468), and one deploy
 *          of an environment runs at a time on a host (`withDeployLock` over `fileDeployLock`). In a product
 *          repository (a root runway with `surfaces` or `mobile`), the web and mobile kinds ship through the
 *          product publish (`runDeployProduct`, the former `--product` path, which stays as an alias) inside the
 *          same lock, and the other kinds through `deploy()`.
 * Boundary: the CLI picks the providers and prints; every change is a provider's. Logins are each provider CLI's own
 *           (OIDC in CI), and Worker ids, vars and secrets are read by the provider from this process's environment.
 * Runtime: node
 * Governing contract: ADR 0352 (decisions 1, 3 and 6); STA-1921.
 */
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildConfig } from "@stackra/config";
import {
  deploy,
  deployTargets,
  DeployKind,
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
  runProgram,
} from "@stackra/runway/node";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { runDeployProduct } from "#node/product/functions/run-deploy-product.function";
import type { CliContext } from "#node/types/cli-context.type";

/** Where the deploy locks of this host live. */
const LOCKS = join(tmpdir(), "stackra-runway-locks");

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
 * @throws CliUsageError when the environment declares an approval and `--approved` is not passed.
 * @throws RunwayLockedError when another deploy of the environment holds this host's lock.
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
      : (await runProgram("git", ["rev-parse", "HEAD"], { cwd })).trim();
  // A product's web surfaces and mobile apps ship through the product publish (edge KV, R2, EAS submit), not a
  // Runway provider; every other kind goes through `deploy()` (STA-1972).
  const productKinds = [
    ...(root.surfaces === undefined ? [] : [DeployKind.Web]),
    ...(root.mobile === undefined ? [] : [DeployKind.Mobile]),
  ].filter((kind) => kinds === undefined || kinds.includes(kind));
  const only = (kinds ?? (Object.values(DeployKind) as string[])).filter(
    (kind) => !(productKinds as string[]).includes(kind),
  ) as DeployKind[];
  const product = productKinds.length === 0 ? undefined : productContext(context, productKinds);

  if (values["dry-run"] === true) {
    for (const target of deployTargets(root, environment as RunwayEnvironment)) {
      if (!only.includes(target.kind)) continue;
      const provider = providers.find((candidate) => candidate.destination === target.destination);
      io.out(
        `${target.id} → ${target.destination}${provider === undefined ? " (no provider)" : ""}\n`,
      );
      for (const step of provider?.plan(target, sha) ?? [])
        io.out(`  ${step.cwd ?? "."}$ ${[step.command, ...step.args].join(" ")}\n`);
    }
    return product === undefined ? 0 : runDeployProduct(product);
  }

  // ADR 0468: an environment with an approval ships only from the job behind it, which passes --approved.
  const approval = root.environments[environment as RunwayEnvironment]?.deploy?.approval;
  if (approval !== undefined && values["approved"] !== true)
    throw new CliUsageError(
      `${environment} deploys only after its approval (${approval}): run the deploy in the job behind it and pass --approved`,
    );
  // One deploy of an environment at a time on this host; the caller workflow's concurrency group serialises runners.
  const outcome = await withDeployLock(
    root,
    environment as RunwayEnvironment,
    fileDeployLock(LOCKS),
    async () => {
      if (product !== undefined) {
        const code = await runDeployProduct(product);
        if (code !== 0) return { code, results: [] };
      }
      const results =
        only.length === 0
          ? []
          : await deploy(root, environment as RunwayEnvironment, sha, providers, only);
      return { code: 0, results };
    },
  );
  for (const { record, report } of outcome.results)
    io.out(
      `${record.target} ${record.sha.slice(0, 12)} ${report.status}${record.reference === "" ? "" : ` (${record.reference})`}\n`,
    );
  return outcome.code;
}

/** The context of the product publish for `kinds` (web, mobile): the same flags, scoped to those kinds. */
function productContext(context: CliContext, kinds: readonly DeployKind[]): CliContext {
  const web = kinds.includes(DeployKind.Web);
  const mobile = kinds.includes(DeployKind.Mobile);
  return {
    ...context,
    values: {
      ...context.values,
      product: true,
      ...(web && !mobile ? { "surfaces-only": true } : {}),
      ...(mobile && !web ? { "mobile-only": true } : {}),
    },
  };
}
